
import { MikroORM } from '@mikro-orm/core';
import type { PostgreSqlDriver } from '@mikro-orm/postgresql';
import dotenv from 'dotenv';
import mikroOrmConfig from './mikro-orm.config';
import { Room, RoomType } from './entities/Room';
import { LabStation, LabStationStatus } from './entities/LabStation';

dotenv.config();

const seedRooms = async () => {
    const orm = await MikroORM.init<PostgreSqlDriver>(mikroOrmConfig);
    const em = orm.em.fork();

    try {
        // 1. Seed Rooms
        const roomCount = await em.count(Room);
        if (roomCount === 0) {
            console.log('Seeding rooms...');
            const rooms = [
                // Lecture Halls
                new Room('Lecture Hall A', 'Main Building', 1, 150, RoomType.LectureHall),
                new Room('Lecture Hall B', 'Main Building', 1, 120, RoomType.LectureHall),
                new Room('Auditorium', 'Science Center', 1, 300, RoomType.LectureHall),

                // Classrooms
                new Room('Room 101', 'Main Building', 1, 30, RoomType.Classroom),
                new Room('Room 102', 'Main Building', 1, 35, RoomType.Classroom),
                new Room('Room 201', 'Main Building', 2, 40, RoomType.Classroom),
                new Room('Room 202', 'Main Building', 2, 25, RoomType.Classroom),

                // Labs
                new Room('Computer Lab 1', 'Science Center', 2, 25, RoomType.Lab),
                new Room('Physics Lab', 'Science Center', 3, 20, RoomType.Lab),
                new Room('Chemistry Lab', 'Science Center', 3, 20, RoomType.Lab),

                // Conference Rooms
                new Room('Conference Room A', 'Admin Block', 2, 12, RoomType.ConferenceRoom),
                new Room('Meeting Room 1', 'Main Building', 2, 8, RoomType.ConferenceRoom),
            ];

            // Add some details
            // rooms[0].amenities = ['Projector', 'Sound System', 'Whiteboard'];
            // rooms[7].amenities = ['Computers', 'Projector', 'Whiteboard', 'AC'];

            for (const room of rooms) {
                em.persist(room);
            }
            await em.flush();
            console.log(`Seeded ${rooms.length} rooms.`);
        } else {
            console.log('Rooms already exist. Skipping room creation.');
        }

        // 2. Seed Lab Stations
        const stationCount = await em.count(LabStation);
        if (stationCount === 0) {
            console.log('Seeding lab stations...');
            const labs = await em.find(Room, { type: RoomType.Lab });

            if (labs.length === 0) {
                console.log('No labs found to seed stations for (unexpected).');
            } else {
                let totalStations = 0;
                for (const lab of labs) {
                    // Create 8 stations per lab
                    for (let i = 1; i <= 8; i++) {
                        const stationNumber = `S-${String(i).padStart(2, '0')}`;
                        const station = new LabStation(stationNumber, lab);
                        station.description = `Workstation ${i} in ${lab.name}`;
                        station.status = LabStationStatus.Available;
                        // station.equipment = ['PC', 'Power Supply', 'Multimeter'];

                        em.persist(station);
                        totalStations++;
                    }
                }
                await em.flush();
                console.log(`Seeded ${totalStations} lab stations across ${labs.length} labs.`);
            }
        } else {
            console.log('Lab stations already exist. Skipping station creation.');
        }

    } catch (error) {
        console.error('Error seeding:', error);
    } finally {
        await orm.close();
    }
};

seedRooms();
