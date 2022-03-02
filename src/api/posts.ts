import {
  collection,
  DocumentData,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  QuerySnapshot,
  startAfter,
  Unsubscribe,
} from "firebase/firestore";
import db from "../utils/firebase";

const postSize = 4;

export function getFirstPostBatch(
  snapshotCallback: (querySnapshot: QuerySnapshot<DocumentData>) => void
): Unsubscribe {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(postSize)
  );

  return onSnapshot(q, snapshotCallback);
}

/**
 * this function will be fired each time the user click on 'More Posts' button,
 * it receive key of last post in previous batch, then fetch next posts
 * starting after last fetched post.
 */
export async function postsNextBatch(lastDocument: any) {
  const next = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    startAfter(lastDocument),
    limit(postSize)
  );

  const posts: any[] = [];

  const documentSnapshots = await getDocs(next);

  const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];

  documentSnapshots.forEach((doc) => {
    posts.push({ id: doc.id, ...doc.data() });
  });

  return { posts, lastVisible };
}
