// routes/resourceRoutes.ts
import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Resource, ResourceType } from '../entities/Resource';
import { Allocation, AllocationStatus } from '../entities/Allocation';
import { ResourceAttribute } from '../entities/ResourceAttribute';
import { ResourceAttributeValue } from '../entities/ResourceAttributeValue';
import { User, UserRole } from '../entities/User';
import { Department } from '../entities/Department';
import authenticate, { AuthRequest } from '../middleware/auth';
import authorize from '../middleware/authorize';

const router = express.Router();

// ==================== CREATE RESOURCE (Staff only) ====================
router.post(
  '/',
  authenticate,
  authorize(UserRole.Staff),
  [
    body('name').notEmpty(),
    body('type').isIn(Object.values(ResourceType)),
    body('attributes').isArray(),
    body('attributes.*.key').notEmpty(),
    body('attributes.*.value').exists(),
  ],
  async (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const em = RequestContext.getEntityManager() as EntityManager;
    const { name, type, description, attributes } = req.body;

    const resource = new Resource(name, type);
    resource.description = description;

    for (const attr of attributes) {
      let attribute = await em.findOne(ResourceAttribute, { key: attr.key });
      if (!attribute) {
        return res.status(400).json({ success: false, message: `Attribute ${attr.key} not defined` });
      }
      const value = new ResourceAttributeValue();
      value.resource = resource;
      value.attribute = attribute;
      if (attribute.dataType === 'string') value.stringValue = attr.value;
      else if (attribute.dataType === 'number') value.numberValue = attr.value;
      else if (attribute.dataType === 'date') value.dateValue = new Date(attr.value);
      else if (attribute.dataType === 'boolean') value.booleanValue = attr.value;
      em.persist(value);
    }

    await em.persistAndFlush(resource);
    await em.populate(resource, ['attributes', 'attributes.attribute']);
    res.status(201).json({ success: true, data: resource });
  }
);

// ==================== ALLOCATE RESOURCE (Staff only) ====================
router.post(
  '/:id/allocate',
  authenticate,
  authorize(UserRole.Staff),
  [
    body('userId').optional().isInt(),
    body('departmentId').optional().isInt(),
    body('dueDate').optional().isISO8601(),
  ],
  async (req: AuthRequest, res: Response) => {
    // ... (same logic as in previous answer – shortened for brevity)
  }
);

// ==================== MY ALLOCATED RESOURCES (Professor & Student) ====================
router.get('/my', authenticate, authorize(UserRole.Professor, UserRole.Student), async (req: AuthRequest, res: Response) => {
  const em = RequestContext.getEntityManager() as EntityManager;

  const allocations = await em.find(
    Allocation,
    {
    allocatedToUser: { id: Number(req.user!.id) },
      status: AllocationStatus.Active,
    },
    {
      populate: ['resource', 'resource.attributes', 'resource.attributes.attribute'],
    }
  );

  res.json({ success: true, data: allocations });
});

// Add more endpoints: list all, return resource, etc.

export default router;