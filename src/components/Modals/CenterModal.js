import React, { useState } from 'react';


const CenterModal = ({children}) => {

    return (
        <>
        <div className='modal-wrapper'></div>
        <div className='w-max-content h-max-content br-6px modal-container'>
            {children}
        </div>
        </>
       
    );
};

export default CenterModal;