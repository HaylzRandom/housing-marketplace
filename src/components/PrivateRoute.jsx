import React from 'react';
import { Navigate } from 'react-router-dom';

// Components
import Spinner from './Spinner';

// Hooks
import { useAuthStatus } from '../hooks/useAuthStatus';

const PrivateRoute = ({ children }) => {
	const { loggedIn, checkingStatus } = useAuthStatus();

	if (checkingStatus) {
		return <Spinner />;
	}

	return loggedIn ? children : <Navigate to='/sign-in' />;
};

export default PrivateRoute;
