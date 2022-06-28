// Check logged in status with Firebase

import { useEffect, useState } from 'react';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';

export const useAuthStatus = () => {
	const [loggedIn, setLoggedIn] = useState(false);
	const [checkingStatus, setCheckingStatus] = useState(true);

	useEffect(() => {
		const auth = getAuth();
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setLoggedIn(true);
			}
			setCheckingStatus(false);
		});

		return unsubscribe;
	}, []);

	return { loggedIn, checkingStatus };
};
