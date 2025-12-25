import express from 'express';
import { RequestContext, wrap } from '@mikro-orm/core';
import { ProfessionalDevelopment, PDActivityType } from '../entities/ProfessionalDevelopment';
import { User } from '../entities/User';
import { Attribute, AttributeDataType } from '../entities/Attribute';
import { ProfessionalDevelopmentAttributeValue } from '../entities/ProfessionalDevelopmentAttributeValue';

const router = express.Router();

function flattenPD(pd: ProfessionalDevelopment): any {
    const obj = wrap(pd).toJSON() as any;
    if (pd.attributes && pd.attributes.isInitialized()) {
        pd.attributes.getItems().forEach(attrVal => {
            obj[attrVal.attribute.name] = attrVal.value;
        });
    }
    return obj;
}

// Helper function to upsert attribute
async function upsertAttribute(em: any, pd: ProfessionalDevelopment, key: string, value: any, dataType: AttributeDataType) {
    if (value === undefined || value === null) return;

    let attr = await em.findOne(Attribute, { name: key, entityType: 'ProfessionalDevelopment' });
    if (!attr) {
        attr = new Attribute(key, key.charAt(0).toUpperCase() + key.slice(1), dataType, 'ProfessionalDevelopment');
        await em.persist(attr);
    }

    const existingVal = pd.attributes.getItems().find(a => a.attribute.name === key);
    if (existingVal) {
        existingVal.setValue(value);
    } else {
        const newVal = new ProfessionalDevelopmentAttributeValue(pd);
        newVal.attribute = attr;
        newVal.setValue(value);
        pd.attributes.add(newVal);
        em.persist(newVal);
    }
}

// GET /api/pd/activities
router.get('/activities', async (req, res) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { userId } = req.query;

        const options: any = {};
        if (userId) {
            options.professor = userId;
        }

        const pdRepo = em.getRepository(ProfessionalDevelopment);
        const activities = await pdRepo.find(options, { populate: ['professor', 'attributes', 'attributes.attribute'] });

        res.json(activities.map(flattenPD));
    } catch (error: any) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching PD activities' });
    }
});

// POST /api/pd/activities
router.post('/activities', async (req, res) => {
    try {
        const em = RequestContext.getEntityManager();
        if (!em) return res.status(500).json({ message: 'EntityManager not found' });

        const { professorId, title, activityType, date, hours, provider, notes } = req.body;

        // validate provider also if it's considered required effectively in old code? 
        // It was required in check: "if (!professorId || ... || !provider)"
        if (!professorId || !title || !activityType || !date || !hours || !provider) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const userRepo = em.getRepository(User);
        const professor = await userRepo.findOne({ id: professorId });

        if (!professor) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        const pd = new ProfessionalDevelopment(
            professor,
            title,
            activityType as PDActivityType,
            new Date(date),
            hours
        );

        await em.persist(pd);

        if (provider) {
            await upsertAttribute(em, pd, 'provider', provider, AttributeDataType.String);
        }
        if (notes) {
            await upsertAttribute(em, pd, 'notes', notes, AttributeDataType.String);
        }

        await em.flush();
        await em.populate(pd, ['attributes', 'attributes.attribute']);
        res.status(201).json(pd);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error creating PD activity' });
    }
});

export default router;
