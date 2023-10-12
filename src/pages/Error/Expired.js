import React from 'react';
import ExpiryImg from "../../assets/expiry-img.png";

const Expired = () => {
    return (
        <div style={{ height: "100vh", width: "100vw" }}>
            <div className="v1--styles d-flex justify-content-center align-items-center w-100 h-100">
                <div className="d-flex flex-column">
                    <div className='fw-700 fs-60px '>Your Invite has<br />expired</div>
                    <div className='fs-20px color-grey-600 mb-48px'>Sorry, the invite sent to this email has expired.<br />Please contact the Admin for another invite.</div>
                </div>
                <img className='ml-100px' src={ExpiryImg} width={'601px'} height={'596px'}/>

            </div>
        </div>
    );
};

export default Expired;