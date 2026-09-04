import { addDoc, collection, getFirestore } from 'firebase/firestore'
import { firebaseApp } from './firebase'

export async function recordLearningEvent(type: string, payload: Record<string, unknown>) {
  if (!firebaseApp) return
  try {
    await addDoc(collection(getFirestore(firebaseApp), 'learning_events'), {
      type,
      payload,
      createdAt: new Date().toISOString(),
    })
  } catch (error) {
    console.warn('Firebase event write skipped:', error)
  }
}
