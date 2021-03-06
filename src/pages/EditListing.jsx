import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { toast } from 'react-toastify';

// Firebase
import { getAuth, onAuthStateChanged } from 'firebase/auth';

import { serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase.config';

// Components
import Spinner from '../components/Spinner';

const initialFormState = {
	type: 'rent',
	name: '',
	bedrooms: 1,
	bathrooms: 1,
	parking: false,
	furnished: false,
	address: '',
	offer: false,
	regularPrice: 0,
	discountedPrice: 0,
	images: {},
	latitude: 0,
	longitude: 0,
};

function EditListing() {
	const geolocationEnabled = true;
	const [loading, setLoading] = useState(false);
	const [listing, setListing] = useState(null);
	const [formData, setFormData] = useState(initialFormState);

	const {
		type,
		name,
		bedrooms,
		bathrooms,
		parking,
		furnished,
		address,
		offer,
		regularPrice,
		discountedPrice,
		latitude,
		longitude,
	} = formData;

	const auth = getAuth();
	const navigate = useNavigate();
	const params = useParams();

	// Redirect if listing is not user's
	useEffect(() => {
		if (listing && listing.userRef !== auth.currentUser.uid) {
			toast.error('You cannot edit that listing');
			navigate('/');
		}
	});

	// Fetch listing to edit
	useEffect(() => {
		setLoading(true);
		const fetchListing = async () => {
			const docRef = doc(db, 'listings', params.listingId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				setListing(docSnap.data());
				setFormData({ ...docSnap.data(), address: docSnap.data().location });
				setLoading(false);
			} else {
				navigate('/');
				toast.error('Listing does not exist!');
			}
		};

		fetchListing();
	}, [navigate, params.listingId]);

	// Sets userRef to logged in user
	useEffect(() => {
		const unsubscribe = onAuthStateChanged(auth, (user) => {
			if (user) {
				setFormData({ ...formData, userRef: user.uid });
			} else {
				navigate('/sign-in');
			}
		});

		return unsubscribe;
		// eslint-disable-next-line
	}, [auth, navigate]);

	const onSubmit = async (e) => {
		e.preventDefault();
		setLoading(true);

		// Checking that discounted price less than regular price
		if (discountedPrice >= regularPrice) {
			setLoading(false);
			toast.error('Discounted price needs to be less than regular price!');
			return;
		}

		// Checking that images uploaded are limited to 6
		/* if (images.length > 6) {
			setLoading(false);
			toast.error('Max 6 images only!');
			return;
		} */

		let geolocation = {};

		// Using Geoapify API
		if (geolocationEnabled) {
			const response = await fetch(
				`https://api.geoapify.com/v1/geocode/search?text=${address}&format=json&apiKey=${process.env.REACT_APP_GEOCODE_API_KEY}`
			);

			const data = await response.json();

			// Checks if array returned has data or not
			if (data.results.length < 1) {
				setLoading(false);
				toast.error('Please enter a correct address');
				return;
			} else {
				geolocation.lat = data.results[0]?.lat;
				geolocation.lon = data.results[0]?.lon;
			}
		} else {
			geolocation.lat = latitude;
			geolocation.lon = longitude;
		}

		// Store Image in Firebase - ON HOLD FOR EDIT LISTING
		/* const storeImage = async (image) => {
			return new Promise((resolve, reject) => {
				const storage = getStorage();
				const fileName = `${auth.currentUser.uid}-${image.name}-${uuidv4()}`;

				const storageRef = ref(storage, 'images/' + fileName);

				const uploadTask = uploadBytesResumable(storageRef, image);

				uploadTask.on(
					'state_changed',
					(snapshot) => {
						const progress =
							(snapshot.bytesTransferred / snapshot.totalBytes) * 100;
						console.log('Upload is ' + progress + '% done');
						 						switch (snapshot.state) {
							case 'paused':
								console.log('Upload is paused');
								break;
							case 'running':
								console.log('Upload is running');
								break;
						}
					},
					(error) => {
						// Handle unsuccessful uploads
						reject(error);
					},
					() => {
						// Handle successful uploads on complete
						// For instance, get the download URL: https://firebasestorage.googleapis.com/...
						getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
							resolve(downloadURL);
						});
					}
				);
			});
		}; */

		/* const imageUrls = await Promise.all(
			[...images].map((image) => storeImage(image))
		).catch(() => {
			setLoading(false);
			toast.error('Images not uploaded');
			return;
		}); */

		const formDataCopy = {
			...formData,
			geolocation,
			timestamp: serverTimestamp(),
		};

		formDataCopy.location = address;
		delete formDataCopy.address;
		delete formDataCopy.longitude;
		delete formDataCopy.latitude;
		!formDataCopy.offer && delete formDataCopy.discountedPrice;

		console.log(formDataCopy);

		// Update listing
		const docRef = doc(db, 'listings', params.listingId);
		await updateDoc(docRef, formDataCopy);

		setLoading(false);
		toast.success('Listing published!');
		navigate(`/category/${formDataCopy.type}/${docRef.id}`);
	};

	const onMutate = (e) => {
		let boolean = null;

		if (e.target.value === 'true') {
			boolean = true;
		}
		if (e.target.value === 'false') {
			boolean = false;
		}

		// Files
		if (e.target.files) {
			setFormData((prevState) => ({
				...prevState,
				images: e.target.files,
			}));
		}

		// Text / Booleans / Numbers
		if (!e.target.files) {
			setFormData((prevState) => ({
				...prevState,
				[e.target.id]: boolean ?? e.target.value,
			}));
		}
	};

	if (loading) {
		return <Spinner />;
	}

	return (
		<div className='profile'>
			<header>
				<p className='pageHeader'>Edit Listing</p>
			</header>
			<main>
				<form onSubmit={onSubmit}>
					<label className='formLabel'>Sell / Rent</label>
					<div className='formButtons'>
						<button
							type='button'
							className={type === 'sale' ? 'formButtonActive' : 'formButton'}
							id='type'
							value='sale'
							onClick={onMutate}>
							Sell
						</button>
						<button
							type='button'
							className={type === 'rent' ? 'formButtonActive' : 'formButton'}
							id='type'
							value='rent'
							onClick={onMutate}>
							Rent
						</button>
					</div>
					<label className='formLabel'>Name</label>
					<input
						type='text'
						className='formInputName'
						id='name'
						value={name}
						onChange={onMutate}
						maxLength='32'
						minLength='10'
						required
					/>
					<div className='formRooms flex'>
						<div>
							<label className='formLabel'>Bedrooms</label>
							<input
								type='number'
								className='formInputSmall'
								id='bedrooms'
								value={bedrooms}
								onChange={onMutate}
								min='1'
								max='50'
								required
							/>
						</div>
						<div>
							<label className='formLabel'>Bathrooms</label>
							<input
								type='number'
								className='formInputSmall'
								id='bathrooms'
								value={bathrooms}
								onChange={onMutate}
								min='1'
								max='50'
								required
							/>
						</div>
					</div>

					<label className='formLabel'>Parking Spaces</label>
					<div className='formButtons'>
						<button
							className={parking ? 'formButtonActive' : 'formButton'}
							type='button'
							id='parking'
							value={true}
							onClick={onMutate}
							min='1'
							max='50'>
							Yes
						</button>
						<button
							className={
								!parking && parking !== null ? 'formButtonActive' : 'formButton'
							}
							type='button'
							id='parking'
							value={false}
							onClick={onMutate}>
							No
						</button>
					</div>

					<label className='formLabel'>Furnished</label>
					<div className='formButtons'>
						<button
							className={furnished ? 'formButtonActive' : 'formButton'}
							type='button'
							id='furnished'
							value={true}
							onClick={onMutate}>
							Yes
						</button>
						<button
							className={
								!furnished && furnished !== null
									? 'formButtonActive'
									: 'formButton'
							}
							type='button'
							id='furnished'
							value={false}
							onClick={onMutate}>
							No
						</button>
					</div>

					<label className='formLabel'>Address</label>
					<textarea
						className='formInputAddress'
						type='text'
						id='address'
						value={address}
						onChange={onMutate}
						required
					/>

					{!geolocationEnabled && (
						<div className='formLatLng flex'>
							<div>
								<label className='formLabel'>Latitude</label>
								<input
									className='formInputSmall'
									type='number'
									id='latitude'
									value={latitude}
									onChange={onMutate}
									required
								/>
							</div>
							<div>
								<label className='formLabel'>Longitude</label>
								<input
									className='formInputSmall'
									type='number'
									id='longitude'
									value={longitude}
									onChange={onMutate}
									required
								/>
							</div>
						</div>
					)}

					<label className='formLabel'>Offer</label>
					<div className='formButtons'>
						<button
							className={offer ? 'formButtonActive' : 'formButton'}
							type='button'
							id='offer'
							value={true}
							onClick={onMutate}>
							Yes
						</button>
						<button
							className={
								!offer && offer !== null ? 'formButtonActive' : 'formButton'
							}
							type='button'
							id='offer'
							value={false}
							onClick={onMutate}>
							No
						</button>
					</div>

					<label className='formLabel'>Regular Price</label>
					<div className='formPriceDiv'>
						<input
							className='formInputSmall'
							type='number'
							id='regularPrice'
							value={regularPrice}
							onChange={onMutate}
							min='50'
							max='750000000'
							required
						/>
						{type === 'rent' && <p className='formPriceText'>?? / Month</p>}
					</div>

					{offer && (
						<>
							<label className='formLabel'>Discounted Price</label>
							<input
								className='formInputSmall'
								type='number'
								id='discountedPrice'
								value={discountedPrice}
								onChange={onMutate}
								min='50'
								max='750000000'
								required={offer}
							/>
						</>
					)}

					{/* <label className='formLabel'>Images</label>
					<p className='imagesInfo'>
						The first image will be the cover (max 6).
					</p>
					<input
						className='formInputFile'
						type='file'
						id='images'
						onChange={onMutate}
						max='6'
						accept='.jpg,.png,.jpeg'
						multiple
						required
					/> */}

					<button type='submit' className='primaryButton createListingButton'>
						Edit Listing
					</button>
				</form>
			</main>
		</div>
	);
}

export default EditListing;
