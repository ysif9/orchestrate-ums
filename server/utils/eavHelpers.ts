import { EntityManager, Collection, wrap } from '@mikro-orm/core';
import { Attribute, AttributeDataType } from '../entities/Attribute';
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
        let attribute = attributeMap.get(key);

        if (!attribute) {
            // Auto-create attribute if it doesn't exist
            let inferredType = AttributeDataType.String;
            const valStr = String(value).toLowerCase().trim();

            if (typeof value === 'number') {
                inferredType = AttributeDataType.Number;
            } else if (typeof value === 'boolean') {
                inferredType = AttributeDataType.Boolean;
            } else if (!isNaN(Number(value)) && value !== '' && value !== null) {
                inferredType = AttributeDataType.Number;
            } else if (['true', 'false', 'yes', 'no', '1', '0'].includes(valStr)) {
                inferredType = AttributeDataType.Boolean;
            } else if (typeof value === 'string' && !isNaN(Date.parse(value)) && valStr.length > 5 && (valStr.includes('-') || valStr.includes('/'))) {
                inferredType = AttributeDataType.Date;
            }

            attribute = new Attribute(key, key, inferredType, entityType);
            em.persist(attribute);
            attributeMap.set(key, attribute);
        }

        if (attribute) {


            // Determine query filter
            const where: any = { attribute };
            if (entityType === 'User') where.user = entity;
            else if (entityType === 'Course') where.course = entity;
            else if (entityType === 'Department') where.department = entity;
            else if (entityType === 'Applicant') where.applicant = entity;
            else if (entityType === 'Program') where.program = entity;
            else if (entityType === 'ApplicationReview') where.applicationReview = entity;
            else if (entityType === 'Assessment') where.assessment = entity;
            else if (entityType === 'Attachment') where.attachment = entity;
            else if (entityType === 'Booking') where.booking = entity;
            else if (entityType === 'CourseTA') where.courseTA = entity;
            else where.entityId = entity.id;

            let eav = await em.findOne(EntityAttributeValue, where);

            if (!eav) {
                eav = new EntityAttributeValue(attribute, entity.id, entityType);
                if (entityType === 'User') eav.user = entity;
                else if (entityType === 'Course') eav.course = entity;
                else if (entityType === 'Department') eav.department = entity;
                else if (entityType === 'Applicant') eav.applicant = entity;
                else if (entityType === 'Program') eav.program = entity;
                else if (entityType === 'ApplicationReview') eav.applicationReview = entity;
                else if (entityType === 'Assessment') eav.assessment = entity;
                else if (entityType === 'Attachment') eav.attachment = entity;
                else if (entityType === 'Booking') eav.booking = entity;
                else if (entityType === 'CourseTA') eav.courseTA = entity;
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
