import React, { useEffect, useState } from 'react';
import { FilesAPI } from '../../../api/apiConfig';
import { useParams } from 'react-router-dom';
import { Loader } from '../../../components/Loader';
import moment from 'moment';
import { Link } from 'react-router-dom';
import config from '../../../config'
import { urlRegex } from '../../../utils';


const Files = () => {

    const [linkData, setLinkData] = useState({fileUrl: "", fileName: ""});
    const [linkErrors, setLinkErrors] = useState({});
    const {dealId} = useParams();
    const [allFilesList, setAllFilesList] = useState(null)
    const [loading, setLoading] = useState(false);

    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true);
                const filesData = await FilesAPI.getFilesByDeal(dealId);
                if(filesData.status === 200){
                    setAllFilesList(filesData.data.data.attachments);
                }
                setLoading(false);
            }catch(err){
                console.error(err);
                setLoading(false)
            }
        })()
    },[])

    const handleLinkUpload = async () => {
        const errors = {}
        if(!linkData?.fileUrl){
            errors.fileurl = "file url is a required field"
        }else if(!urlRegex.test(linkData?.fileUrl)){
            errors.fileurl = "file url is invalid"
        }
        if(!linkData?.fileName){
            errors.fileName = "file name is a required field"
        }
        setLinkErrors(errors);
        if(Object.entries(errors).length > 0){
            return;
        }
        try{
            setLoading(true)
            const uploadedLink = await FilesAPI.uploadLink(dealId, linkData)
            if(uploadedLink.status === 200){
                const filesData = await FilesAPI.getFilesByDeal(dealId);
                setAllFilesList(filesData?.data?.data?.attachments)
            }
            setLoading(false)
            setLinkData({fileUrl: "", fileName: ""})
        }catch(err){
            console.error(err);
            setLoading(false)
        }
       
    }

    const handleFileUpload = async (e) => {
        try{
            setLoading(true)
            const fileData = Array.from(e.target.files)[0];
            console.log(fileData, "FIL UPLOADED DATA")
            await FilesAPI.uploadFile(dealId, fileData)
            const filesData = await FilesAPI.getFilesByDeal(dealId);
            setAllFilesList(filesData?.data?.data?.attachments);
            setLoading(false)
            e.target.value = null;
        }catch(err){
            setLoading(false)
            e.target.value = null;
            console.error(err)
        }
    }

    const handleDelete = async (file) => {
        try{
            setLoading(true)
            const m = await FilesAPI.deleteFile(dealId, file._id)
            console.log(m, "EM");
            const filesData = await FilesAPI.getFilesByDeal(dealId);
            setAllFilesList(filesData?.data?.data?.attachments);
            setLoading(false)
        }catch(err){
            setLoading(false)
            console.error(err)
        }
    }

    const handleDownload = async (file) => {
        try{
            const downloadedData = await FilesAPI.downloadFile(dealId, file.fileKey);
            console.log(downloadedData, "FILES DATA");

            // Create a temporary URL for the blob
            const url = window.URL.createObjectURL(new Blob([downloadedData.data]));
            console.log(url, 'FILE URL GIVEN')

            // Create a hidden anchor element to trigger the download
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = file.fileName; // Set the desired filename
            document.body.appendChild(a);

            // Trigger the download
            a.click();

            // Clean up the temporary URL and anchor element
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }catch(err){
            console.error(err)
        }
    }


    return (
        <div className='d-flex w-100 h-100 flex-column gap-12px'>
        <div style={{height: "245px"}} className='bg-white w-100 h-245px br-6px px-24px py-16px gap-20px'>
            <div className='d-flex justify-content-center gap-15px'>
                <div className='d-flex w-100 flex-column'>
                    <input 
                    className={`h-40px w-100 py-8px px-12px br-6px input-styles ${linkErrors.fileName ? 'error-input' : '' }`} 
                    value={linkData.fileName}
                    onChange={(e)=>setLinkData(prev => ({...prev, fileName: e.target.value}))} 
                    placeholder={`Type the Link Name`}
                    type='text'/>
                    {linkErrors.linkName  && <p className='error-txt'>{linkErrors.linkName }</p>}
                </div>
                <div className='d-flex w-100 flex-column'>
                    <input 
                    className={`h-40px w-100 py-8px px-12px br-6px input-styles ${linkErrors.fileurl ? 'error-input' : '' }`} 
                    value={linkData.fileUrl}
                    onChange={(e)=>setLinkData(prev => ({...prev, fileUrl: e.target.value}))} 
                    placeholder={`Paste file link here...`}
                    type='text'/>
                    {linkErrors.linkName  && <p className='error-txt'>{linkErrors.linkName }</p>}
                </div>
               
           
                <button onClick={handleLinkUpload} className='primary-btn d-flex-center h-40px w-200px gap-6px fs-14px fw-400 p-10px'> 
                    <i class="ri-add-line fs-20px"></i> Add link
                </button>

            </div>
            <div className='my-14px d-flex-center gap-30px'>
                <div className='h-1px w-72px bg-grey-200'></div>
                <p className='color-grey-500 fw-700 fs-16px'>OR</p>
                <div className='bg-grey-200 h-1px w-72px'></div>
            </div>
            <div className='d-flex-center flex-column dashed-border br-12px h-126px p-16px'>
                <label htmlFor="deal-file" className='cursor txt-file-input-label'>
                    <div className='outline-btn-shadow-icon w-40px h-40px p-10px br-8px d-flex-center mb-12px'><i class="ri-upload-cloud-2-line fs-20px lh-20px"></i></div>
                </label>
                <p className='fs-14px color-grey-600'> <label htmlFor="deal-file" className='cursor txt-file-input-label color-primary-800'>Click to upload</label> or drag and drop</p>
                <p className='fs-14px color-grey-600'>(max 10 MB )</p>
                <input onChange={(e)=>{
                    console.log(e, "function triggered")
                    handleFileUpload(e)}} id="deal-file" type="file" className='file-input-hidden' />
            </div>
        </div>
        <div className='bg-white w-100 h-100 br-6px px-24px py-16px gap-20px'>
            <p className='color-grey-900 fs-16px fw-700 '>Uploaded Files</p>
            <div className='bg-grey-300 h-1px w-100 mb-24px mt-16px'></div>
            {loading ? <Loader /> : 
                allFilesList?.length > 0 ? 
                    <div className='d-flex flex-column gap-8px'>
                        { allFilesList.map((file, i) => <FileCard key={file._id} handleDelete={handleDelete} file={file} handleDownload={handleDownload}/> )}
                    </div>
             : <p>No Files Yet</p>}
        </div>
        </div>
    );
};

const FileCard = ({file, handleDelete, handleDownload}) => {

    console.log(file);
    return (
        <div className='file-card d-flex justify-content-between'>
            <div className='d-flex gap-8px'>
                {file.attachmentType === "LINK" ? <i className="ri-link fs-24px lh-24px"></i> : <i className="ri-folder-2-line fs-24px lh-24px"></i>}
                <div className='d-flex flex-column'>
                    <p className='color-grey-900 fs-16px fw-500'>{file.fileName || ""}</p>
                    <p className='color-grey-500 fs-14px'>by {file.uploadedBy.firstName+ " "+file.uploadedBy.lastName ||  ""}, {moment(file.cts).format('MMM DD, YYYY')} at {moment(file.cts).format('hh:mm A')}</p>
                </div>
            </div>
            <div className='d-flex align-items-center gap-8px'>
                {file.attachmentType !== "LINK" 
                ? <div onClick={() => handleDownload(file)} className='outline-btn-icon d-flex-center cursor br-4px w-30px h-30px'>
                    <i class="ri-download-2-line"></i>
                </div>
                : <a style={{textDecoration: "none", color: "black"}} href={`${file.fileUrl}`} target='_blank'>
                    <div className='outline-btn-icon d-flex-center cursor br-4px w-30px h-30px'>
                        <i class="ri-arrow-right-up-line"></i>
                    </div>
                </a>}
                <div onClick={()=>handleDelete(file)} className='outline-btn-icon cursor d-flex-center br-4px w-30px h-30px'>
                    <i className="ri-delete-bin-5-line"></i>
                </div>
            </div>

        </div>
    )
}

export default Files;