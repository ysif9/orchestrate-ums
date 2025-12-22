// routes/resourceRoutes.ts
import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Resource, ResourceType } from '../entities/Resource';
import { Allocation, AllocationStatus, AllocationTarget, TargetType } from '../entities/Allocation';
import { Attribute, AttributeDataType } from '../entities/Attribute';
import { ResourceAttributeValue } from '../entities/ResourceAttributeValue';
import { User, UserRole } from '../entities/User';
import { Department } from '../entities/Department';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

/**
 * Helper: send validation errors
 */
const sendValidationErrors = (res: Response, errorsArray: any[]) => {
  return res.status(400).json({ success: false, errors: errorsArray });
};

// ==================== CREATE RESOURCE (Staff only) ====================
router.post(
  '/',
  authenticate,
  authorize(UserRole.Staff),
  [
    body('name').notEmpty(),
    body('type').isIn(Object.values(ResourceType)),
    body('attributes').optional().isArray(),
    body('attributes.*.key').notEmpty().withMessage('Attribute key is required'),
    body('attributes.*.value').exists().withMessage('Attribute value is required'),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationErrors(res, errors.array());

    const em = RequestContext.getEntityManager() as EntityManager;
    const { name, type, description, attributes = [] } = req.body;

    try {
      const resource = new Resource(name, type);
      resource.description = description || null;

      // Persist resource first so that relation targets can reference it (Mikro ORM will handle it but persisting is clearer)
      await em.persist(resource);

      for (const attr of attributes) {
        // Use Attribute entity instead of ResourceAttribute
        const attribute = await em.findOne(Attribute, { name: attr.key, entityType: 'Resource' });
        if (!attribute) {
          // Clean up in-memory resource (not flushed) and return error
          return res.status(400).json({ success: false, message: `Attribute '${attr.key}' not defined for Resource` });
        }

        const value = new ResourceAttributeValue(resource);
        value.attribute = attribute;

        if (attribute.dataType === AttributeDataType.Number) {
          const num = Number(attr.value);
          if (isNaN(num)) {
            return res.status(400).json({ success: false, message: `Attribute ${attr.key} must be a number` });
          }
          value.numberValue = num;
        } else if (attribute.dataType === AttributeDataType.Date) {
          const date = new Date(attr.value);
          if (isNaN(date.getTime())) {
            return res.status(400).json({ success: false, message: `Attribute ${attr.key} must be a valid date` });
          }
          value.dateValue = date;
        } else if (attribute.dataType === AttributeDataType.Boolean) {
          if (['true', 'false', '1', '0', 'yes', 'no'].includes(String(attr.value).toLowerCase())) {
            value.booleanValue = ['true', '1', 'yes'].includes(String(attr.value).toLowerCase());
          } else {
            return res.status(400).json({ success: false, message: `Attribute ${attr.key} must be a boolean` });
          }
        } else {
          value.stringValue = String(attr.value);
        }

        await em.persist(value);
      }

      await em.flush();

      await em.populate(resource, ['attributes', 'attributes.attribute']);
      return res.status(201).json({ success: true, data: resource });
    } catch (err) {
      console.error('Error creating resource:', err);
      return res.status(500).json({ success: false, message: 'Error creating resource' });
    }
  }
);

// ==================== LIST ALL RESOURCES ====================
router.get('/', authenticate, async (req, res) => {
  const em = RequestContext.getEntityManager() as EntityManager;
  try {
    const resources = await em.find(Resource, {}, {
      populate: ['attributes', 'attributes.attribute', 'allocations']
    });

    // Optionally compute availability dynamically (safer than relying solely on isAvailable)
    const result = resources.map((r) => {
      const hasActive = r.allocations.getItems().some((a: any) => a.status === AllocationStatus.Active);
      // Ensure isAvailable flag matches allocations (keep DB flag but correct it if out of sync in response)
      r.isAvailable = !hasActive;
      return r;
    });

    return res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error listing resources:', err);
    return res.status(500).json({ success: false, message: 'Error loading resources' });
  }
});

// ==================== ALLOCATE RESOURCE (Staff only) ====================
router.post(
  '/:id/allocate',
  authenticate,
  authorize(UserRole.Staff),
  [
    body('userId').optional(),
    body('departmentId').optional().isInt(),
    body('dueDate').optional().isISO8601(),
    body('notes').optional().isString(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return sendValidationErrors(res, errors.array());

    const em = RequestContext.getEntityManager() as EntityManager;
    const { id } = req.params;
    const { userId, departmentId, dueDate, notes } = req.body;

    if (!userId && !departmentId) {
      return res.status(400).json({ success: false, message: 'Must specify either userId (or email) or departmentId' });
    }

    try {
      const resource = await em.findOne(Resource, Number(id), { populate: ['allocations'] });
      if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

      // Check for active allocation
      // Check for active allocation
      const activeAllocation = resource.allocations.getItems().find(a => a.status === AllocationStatus.Active);
      if (activeAllocation) {
        return res.status(400).json({ success: false, message: 'Resource already allocated', data: { allocationId: activeAllocation.id } });
      }

      let targetType: TargetType;
      let targetId: number;
      let targetName: string;

      if (userId) {
        // Accept numeric id or email
        let user: any = null;
        if (!isNaN(Number(userId))) {
          user = await em.findOne(User, Number(userId));
        } else {
          user = await em.findOne(User, { email: String(userId).toLowerCase() });
        }

        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        targetType = TargetType.User;
        targetId = user.id;
        targetName = `${user.firstName} ${user.lastName}`;
      } else {
        const department = await em.findOne(Department, Number(departmentId));
        if (!department) return res.status(404).json({ success: false, message: 'Department not found' });
        targetType = TargetType.Department;
        targetId = department.id;
        targetName = department.name;
      }

      // Find or create AllocationTarget
      let allocationTarget = await em.findOne(AllocationTarget, { targetId, targetType });
      if (!allocationTarget) {
        allocationTarget = new AllocationTarget(targetName, targetId, targetType);
        em.persist(allocationTarget);
      }

      const allocation = new Allocation(resource, allocationTarget);

      if (dueDate) {
        allocation.dueDate = new Date(dueDate);
        if (allocation.dueDate <= new Date()) {
          return res.status(400).json({ success: false, message: 'Due date must be in the future' });
        }
      }

      if (notes) allocation.notes = notes;

      resource.isAvailable = false;

      await em.persistAndFlush([allocation, resource]);

      await em.populate(allocation, ['resource', 'target']);

      return res.status(201).json({ success: true, message: 'Resource allocated', data: allocation });
    } catch (err) {
      console.error('Error allocating resource:', err);
      return res.status(500).json({ success: false, message: 'Error allocating resource' });
    }
  }
);

// ==================== RETURN A RESOURCE (by allocation ID) ====================
router.post('/allocations/:id/return', authenticate, async (req: AuthRequest, res: Response) => {
  const em = RequestContext.getEntityManager() as EntityManager;
  const allocId = Number(req.params.id);

  try {
    const allocation = await em.findOne(Allocation, allocId, { populate: ['resource'] });
    if (!allocation) return res.status(404).json({ success: false, message: 'Allocation not found' });
    if (allocation.status !== AllocationStatus.Active) {
      return res.status(400).json({ success: false, message: 'Allocation is not active' });
    }

    // Authorization: allow staff OR the user who has the allocation to return
    const reqUser = req.user!;
    if (!reqUser) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const isStaff = reqUser.role === UserRole.Staff;
    const isOwner = allocation.target && allocation.target.targetId === Number(reqUser.id) && allocation.target.targetType === TargetType.User;
    if (!isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    allocation.status = AllocationStatus.Returned;
    allocation.returnedAt = new Date();
    if (allocation.resource) allocation.resource.isAvailable = true;

    await em.persistAndFlush([allocation, allocation.resource]);

    return res.json({ success: true, message: 'Resource returned', data: allocation });
  } catch (err) {
    console.error('Error returning allocation:', err);
    return res.status(500).json({ success: false, message: 'Error returning allocation' });
  }
});

// ==================== MY ALLOCATED RESOURCES (Professor & Student) ====================
router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  const em = RequestContext.getEntityManager() as EntityManager;
  const user = req.user!;
  if (!user) return res.status(401).json({ success: false, message: 'Unauthorized' });

  try {
    const allocations = await em.find(Allocation, {
      status: AllocationStatus.Active,
      target: {
        $or: [
          { targetId: Number(user.id), targetType: TargetType.User },
          ...(user.departmentId ? [{ targetId: Number(user.departmentId), targetType: TargetType.Department }] : [])
        ]
      }
    }, {
      populate: ['resource', 'resource.attributes', 'resource.attributes.attribute', 'target'],
      orderBy: { allocatedAt: 'DESC' },
    });

    return res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error fetching my allocations:', err);
    return res.status(500).json({ success: false, message: 'Error fetching allocations' });
  }
});

// ==================== ADMIN: ALL ALLOCATIONS ====================
router.get('/allocations', authenticate, authorize(UserRole.Staff), async (req, res) => {
  const em = RequestContext.getEntityManager() as EntityManager;
  try {
    const allocations = await em.find(Allocation, {}, { populate: ['resource', 'target'] });
    return res.json({ success: true, data: allocations });
  } catch (err) {
    console.error('Error loading allocations:', err);
    return res.status(500).json({ success: false, message: 'Error loading allocations' });
  }
});

// ==================== RESOURCE DETAILS & HISTORY ====================
router.get('/:id', authenticate, async (req, res) => {
  const em = RequestContext.getEntityManager() as EntityManager;
  const id = Number(req.params.id);
  try {
    const resource = await em.findOne(Resource, id, { populate: ['attributes', 'attributes.attribute', 'allocations', 'allocations.target'] });
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });

    // Ensure isAvailable consistent with allocations
    const active = resource.allocations.getItems().some((a: any) => a.status === AllocationStatus.Active);
    resource.isAvailable = !active;

    return res.json({ success: true, data: resource });
  } catch (err) {
    console.error('Error fetching resource details:', err);
    return res.status(500).json({ success: false, message: 'Error fetching resource' });
  }
});

router.get('/:id/history', authenticate, async (req, res) => {
  const em = RequestContext.getEntityManager() as EntityManager;
  const resourceId = Number(req.params.id);
  try {
    const history = await em.find(Allocation, { resource: resourceId }, { populate: ['target'], orderBy: { allocatedAt: 'DESC' } });
    return res.json({ success: true, data: history });
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.status(500).json({ success: false, message: 'Error fetching history' });
  }
});

export default router;
