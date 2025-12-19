import { EntityManager, Collection, wrap } from '@mikro-orm/core';
import { Attribute } from '../entities/Attribute';
import { EntityAttributeValue } from '../entities/EntityAttributeValue';

export async function updateEntityAttributes(
    em: EntityManager,
    entity: any,
    entityType: string,
    data: any
) {
    // Get all attributes for this entity type
    const attributes = await em.find(Attribute, { entityType });
    const attributeMap = new Map(attributes.map(a => [a.name, a]));

    for (const [key, value] of Object.entries(data)) {
        if (attributeMap.has(key)) {
            const attribute = attributeMap.get(key)!;

            // Determine query filter
            const where: any = { attribute };
            if (entityType === 'Course') where.course = entity;
            else if (entityType === 'User') where.user = entity;
            else if (entityType === 'Department') where.department = entity;
            else if (entityType === 'Applicant') where.applicant = entity;
            else if (entityType === 'Program') where.program = entity;
            else where.entityId = entity.id;

            let eav = await em.findOne(EntityAttributeValue, where);

            if (!eav) {
                eav = new EntityAttributeValue(attribute, entity.id, entityType);
                if (entityType === 'Course') eav.course = entity;
                else if (entityType === 'User') eav.user = entity;
                else if (entityType === 'Department') eav.department = entity;
                else if (entityType === 'Applicant') eav.applicant = entity;
                else if (entityType === 'Program') eav.program = entity;
                em.persist(eav);
            }

            eav.setValue(value);
        }
    }
}

export function toFlatObject(entity: any) {
    // Convert entity to POJO
    const pojo = wrap(entity).toJSON() as any;

    if (entity.attributes && entity.attributes.isInitialized()) {
        // Process attributes collection
        for (const attrValue of entity.attributes.getItems()) {
            if (attrValue.attribute && attrValue.attribute.name) {
                pojo[attrValue.attribute.name] = attrValue.value;
            }
        }
        // Remove the attributes array from the output to keep it flat
        if (pojo.attributes) {
            delete pojo.attributes;
        }
    }

    return pojo;
}
