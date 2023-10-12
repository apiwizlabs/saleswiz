import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

const modalTypeEnum = {new : "NEW", edit: "EDIT"}

const SideModal = ({ children, heading, onClose, onSubmit, hideSubmitBtn, noFooter, modalType, type, syncNotifs, deleteAllNotifs }) => {
  return createPortal(
    <div className="v1--styles">
      <div className="modal-wrapper">
        {/* <div className='modal-wrapper'></div> */}
        <div
          onClick={onClose}
          className="side-modal-close-btn d-flex-center cursor"
        >
          <i class="ri-close-line lh-20px"></i>
        </div>
        <div className="h-100 w-454px side-modal">
          <div className="position-relative h-100">
          {type === "NOTIFICATIONS" ? 
           <div className="side-modal-header d-flex justify-content-between aligm-items-center">
            <div className="d-flex">
              <p>{heading}</p>
              <button onClick={()=>{syncNotifs()}} className="icon-btn d-flex-center ml-4px cursor"> 
                <i className="ri-refresh-line"></i>
              </button>
            </div> 
            <div onClick={()=>{deleteAllNotifs()}} className="d-flex gap-4px color-primary-800 cursor">
              <i className="ri-check-double-fill"></i>
              <p className="fs-14px fw-500">Mark all as read</p>
            </div>
             
           </div> :  
          <div className="side-modal-header">
              <p>{heading}</p>
          </div>}
           
            <div className="side-modal-body">
              <div className="side-modal-body-wrapper">
                <div className="side-modal-body-container">{children}</div>
              </div>
            </div>

            {!noFooter && <div className=" side-modal-footer d-flex justify-content-end gap-8px h-72px ">
              {hideSubmitBtn? null : <button
                onClick={onSubmit}
                className="primary-btn d-flex-center w-max-content px-16px h-40px"
              >
               {modalType === modalTypeEnum.new ? "Create" : "Save"}
              </button>}
              <button
                onClick={onClose}
                className="secondary-btn w-80px h-40px d-flex-center"
              >
                Cancel
              </button>
            </div>}
          </div>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default SideModal;
