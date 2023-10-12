import React from 'react';
import img404 from '../../assets/404img.png'
import { useNavigate } from 'react-router';

const NotFound = (props) => {
    const navigate = useNavigate()
    function handleAction() {
        navigate("/");
    }
    const goBack = () => {
		navigate(-1);
	}
    return (
        <div style={{ height: "100vh", width: "100vw" }}>
            <div className="v1--styles d-flex justify-content-center align-items-center w-100 h-100">
                <div className="d-flex flex-column">
                    <p className='fs-16px fw-600 lh-24px color-primary-800 mb-12px'>404 error</p>
                    <div className='fw-700 fs-60px '>Uh oh, we can’t find <br /> that page...</div>
                    <div className='fs-20px color-grey-600 mb-48px'>Sorry, the page you are looking for doesn't exist.</div>
                    <div className='d-flex gap-12px'>
                        <button onClick={goBack} className='secondary-btn px-20px py-12px d-flex gap-8px'> <i class="ri-arrow-left-line"></i> Go back</button>
                        <button onClick={handleAction} className='primary-btn px-20px py-12px'>Take me home</button>
                    </div>
                </div>
                <img className='ml-32px' src={img404} width={'445px'} height={'478px'}/>

            </div>
        </div>
    );
};

export default NotFound;
