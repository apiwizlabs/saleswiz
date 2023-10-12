import React from 'react';
import Spinner from 'react-bootstrap/Spinner';

export const Loader = (props) => {
    const {attributes , ...rest} = props
    return (
        <div className={`w-100 h-100 d-flex-center ${attributes}`}>
            <Spinner animation="border" variant="primary" />
        </div>
    );
};

