import { useEffect, useRef, useState } from "react";
import { getFirstPostBatch, postsNextBatch } from "./api/posts";

function App() {
  const [data, setData] = useState<any[]>([]);
  /**
   * Mitigate callback closure stale state reference
   * https://css-tricks.com/dealing-with-stale-props-and-states-in-reacts-functional-components/
   * */
  const dataRef = useRef(data);
  const [lastDocument, setLastDocument] = useState<any>(null);
  const [fetchingData, setFetchingData] = useState(true);

  function updateData(newData: any) {
    dataRef.current = newData;
    setData(newData);
  }

  useEffect(() => {
    const unsub = getFirstPostBatch((querySnapshot) => {
      const posts: any[] = [];
      querySnapshot.docChanges().forEach(({ type, doc }) => {
        /**
         * All posts are of type 'added' when being fetched for the first time
         *    After initial fetch this callback function is triggered when new post is created
         *    This time only newly created post will be of type added
         *    Previously fetched posts will be of type removed
         **/
        if (type === "added") posts.push({ id: doc.id, ...doc.data() });
      });

      /**
       * If posts is fetched for the very first time
       *    Then set current last document as lastDocument for pagination
       *    See: https://firebase.google.com/docs/firestore/query-data/query-cursors#paginate_a_query
       * */
      if (dataRef.current.length === 0)
        setLastDocument(
          querySnapshot.docChanges()[querySnapshot.docChanges().length - 1].doc
        );
      setFetchingData(false);
      updateData([...posts, ...dataRef.current]);
    });

    return () => {
      unsub();
    };
  }, []);

  async function nextDocuments() {
    if (!lastDocument) return;
    setFetchingData(true);
    const { posts, lastVisible } = await postsNextBatch(lastDocument);

    setLastDocument(lastVisible);
    setFetchingData(false);
    updateData([...data, ...posts]);
  }

  return (
    <ul>
      {data.map((post) => (
        <li key={post.id}>
          <p>{post.title}</p>
          <small>
            {new Date(post.createdAt.seconds * 1000).toLocaleString()}
          </small>
        </li>
      ))}
      {fetchingData && <p>Loading...</p>}
      <button onClick={nextDocuments} disabled={!lastDocument}>
        More Posts...
      </button>
    </ul>
  );
}

export default App;
