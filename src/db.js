import { openDB } from 'idb';

const DB_NAME = 'LifeFlowGridDB';
const STORE_NAME = 'gridStore';

let dbPromise;

export async function initDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function loadGrid() {
  try {
    const db = await initDB();
    const record = await db.get(STORE_NAME, 'grid');
    console.log("loadGrid: record", record);
    return record ? record.data : { projects: ['main', 'health', 'project', 'finance'], cells: {} };
  } catch (error) {
    console.error("Error loading grid:", error);
    return { projects: ['main', 'health', 'project', 'finance'], cells: {} };
  }
}

export async function saveGrid(gridData) {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, { id: 'grid', data: gridData });
    console.log("saveGrid: grid saved", gridData);
  } catch (error) {
    console.error("Error saving grid:", error);
  }
}

// New functions for Task Tracker

export async function loadTasks() {
  try {
    const db = await initDB();
    const record = await db.get(STORE_NAME, 'tasks');
    console.log("loadTasks: record", record);
    return record ? record.data : [];
  } catch (error) {
    console.error("Error loading tasks:", error);
    return [];
  }
}

export async function saveTasks(tasksData) {
  try {
    const db = await initDB();
    await db.put(STORE_NAME, { id: 'tasks', data: tasksData });
    console.log("saveTasks: tasks saved", tasksData);
  } catch (error) {
    console.error("Error saving tasks:", error);
  }
}
