import { useState, useEffect } from 'react';
import { ref, onValue, Query, DatabaseReference } from 'firebase/database';
import { rtdb } from '@/lib/firebase';
import { collection, query, onSnapshot, DocumentData, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useMemo, useLayoutEffect } from 'react';

export function useFirestoreCollection<T = DocumentData>(collectionName: string, constraints: QueryConstraint[] = []) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Memoize query để tránh re-run effect nếu constraints không thay đổi
    const memoizedQuery = useMemo(() => query(collection(db, collectionName), ...constraints), [collectionName, constraints]);

    useLayoutEffect(() => {
        const unsubscribe = onSnapshot(memoizedQuery, (snapshot) => {
            const docs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as T[];

            setData(docs);
            setLoading(false);
        }, (err) => {
            console.error(`Error fetching ${collectionName}:`, err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [memoizedQuery]);

    return { data, loading, error };
}

export function useCollection<T = unknown>(path: string, queryFn?: (ref: DatabaseReference) => Query) {
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const dbRef = ref(rtdb, path);
        const q = queryFn ? queryFn(dbRef) : dbRef;

        const unsubscribe = onValue(q, (snapshot) => {
            const result: T[] = [];
            snapshot.forEach((childSnapshot) => {
                result.push({
                    id: childSnapshot.key,
                    ...childSnapshot.val()
                } as T);
            });
            // Thường RTDB trả về theo thứ tự ASC của filter, nếu muốn DESC thì ta đảo ngược mảng ở client
            // hoặc xử lý tùy biến sau.
            setData(result);
            setLoading(false);
        }, (err) => {
            console.error(`Error fetching RTDB path ${path}:`, err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [path, queryFn]);

    return { data, loading, error };
}
