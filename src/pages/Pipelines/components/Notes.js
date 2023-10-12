import React, { useState, useRef, useEffect } from 'react';
import {NotesAPI} from '../../../api/apiConfig';
import useOutsideClick from '../../../utils/useOutsideClick';
import { useParams } from 'react-router-dom';
import { Loader } from '../../../components/Loader';
import moment from 'moment';

const Notes = () => {
    const [notesInput, setNotesInput ] = useState("");
    const [inputFocus, setInputFocus] = useState(false);
    const [notesError, setNotesError] = useState(false);
    const [notesList, setNotesList] = useState(null);
    const [loading, setLoading] = useState(false);
    const {dealId} = useParams()
    const notesRef = useRef(null);

    useEffect(()=>{
        (async ()=>{
            try{
                setLoading(true)
                const notesData = await NotesAPI.getNotes(dealId);
                if(notesData.status === 200){
                    console.log(notesData?.data?.data, "Notes Dataa");
                    setNotesList(notesData?.data?.data)
                }
                setLoading(false);
            }catch(err){
                setLoading(false)
                console.error(err)
            }
        })()
    },[])

    const handleNoteSubmit = async () => {
        if(!notesInput){
            setNotesError(true);
            return;
        }
        try{
            setLoading(true);
            const createdNote = await NotesAPI.createNote(dealId, {notesContent: notesInput})
            if(createdNote.status === 200){
                const notesData = await NotesAPI.getNotes(dealId)
                setNotesList(notesData?.data?.data)
            }
            setLoading(false);
            setInputFocus(false);
            setNotesInput("");
        }catch(err){
            setLoading(false);
            console.error(err)
        }
    }

    useOutsideClick(notesRef, ()=>{
        setInputFocus(false);
    })

    return (
        <div className='bg-white w-100 h-100 br-6px px-24px py-16px gap-20px overflow-y-scroll'>
            <div className='h-40px d-flex align-items-center mb-24px'>
                <p className='color-grey-900 fs-16px fw-700'>Notes</p>
            </div>
            <div ref={notesRef}>
                <textarea style={{height: `${inputFocus ? '140px' : '40px'}`, resize: 'none'}} className={`py-8px px-12px br-6px input-styles w-100 mb-24px ${notesError ? 'error-input' : ''}`}
                name="notes"
                onClick={()=>{setInputFocus(true)}}
                value={notesInput}
                onChange={(e)=>setNotesInput(e.target.value)} placeholder='Type a Note..' type='text'/> 
               {inputFocus && 
                <div className='d-flex gap-16px'>
                    <button onClick={(e)=>{
                        e.stopPropagation()
                        handleNoteSubmit()}} 
                    className='primary-btn py-10px w-64px h-40px d-flex-center'>Save</button>
                    <button onClick={()=>{
                        setInputFocus(false);
                        setNotesInput("");
                        setNotesError(false);
                    }} className='secondary-btn w-80px py-10px px-16px h-40px d-flex-center'>Cancel</button>
                </div>}
            </div>
           {loading ? <Loader /> : 
           notesList?.length > 0 ? <div className={`d-flex flex-column gap-8px ${inputFocus ? 'mt-34px' : ''}`}>
            {notesList.reverse().map(note => {
                console.log(note, "NOTE SINGLE DATA")
                return (
                    <NoteCard note={note} dealId={dealId} setLoading={setLoading} setNotesList={setNotesList} />
                )
            })}
            </div> : <p>No Notes Yet</p>}
                
        </div>
    );
};

const NoteCard = ({note, dealId, setLoading, setNotesList}) => {

    const [editNote, setEditNote] = useState(false);
    const [editNoteInput, setEditNoteInput] = useState(note.notesContent);
    const [notesError, setNotesError] = useState(false)
    const [noteFocus, setNoteFocus] = useState(false);

    const handleDeleteNote = async () => {
        try{
            setLoading(true);
            const deletedNote = await NotesAPI.deleteNote(note._id)
            if(deletedNote.status === 200){
                const notesData = await NotesAPI.getNotes(dealId)
                setNotesList(notesData?.data?.data)
            }
            setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false);
        }
    }

    const handleNoteUpdate = async () => {
        if(!editNoteInput){
            setNotesError(true);
            return;
        }
        try{
            setLoading(true);            
            const editedNote = await NotesAPI.editNote(note._id, {notesContent: editNoteInput})
            if(editedNote.status === 200){
                const notesData = await NotesAPI.getNotes(dealId)
                setNotesList(notesData?.data?.data)
            }
            setLoading(false)
        }catch(err){
            console.error(err);
            setLoading(false);
        }
    }

    return (
        <div onMouseEnter={()=>{setNoteFocus(true)}} onMouseLeave={()=>setNoteFocus(false)} className='d-flex flex-column gap-12px p-16px note'>
            <div className='d-flex justify-content-between align-items-center'>
            <div className='d-flex align-items-center'>
                {note?.createdBy?.profilePicture?.url ? 
                <img src={note?.createdBy?.profilePicture?.url} width="24px" height="24px" className='roundedImage mr-12px' /> : 
                <div className='name-pic roundedImage d-flex-center color-grey-600 fs-12px w-24px h-24px fw-700'>
                {note?.createdBy?.firstName[0]?.toUpperCase()}
            </div>}
                <p className='fw-700 fs-14px d-flex align-items-center gap-4px color-black-purple'>{note.createdBy?.firstName + " " + note.createdBy?.lastName} <span className='fs-18px color-grey-900 fw-400'>•</span> <span className='color-grey-600 fs-14px fw-400'>{moment(note.mts).format('MMM DD, YYYY hh:mm A')}</span> </p>
                {note.mts !== note.cts && <p style={{fontStyle: "italic"}} className='fs-14px color-grey-600 fw-500 fs-14px ml-16px'>Edited</p>}
            </div>
              {noteFocus && <div className='d-flex gap-14px'> 
                    <div onClick={()=>{
                        setEditNote(true)
                    }} className='grey-box br-6px cursor'><i className="ri-pencil-line fs-16px lh-16px"></i></div>
                    <i onClick={handleDeleteNote} className="ri-delete-bin-5-line cursor p-3px fs-20px lh-20px"></i>
                </div>}
            </div>
            {editNote ? 
                <textarea style={{height: '100px', resize: 'none'}} className={`py-8px px-12px br-6px input-styles w-100 ${notesError ? 'error-input' : ''}`}
                name="notes"
                value={editNoteInput}
                onChange={(e)=>setEditNoteInput(e.target.value)} placeholder='Type a Note..' type='text'/> 
                : 
                <p className='color-grey-900 fs-16px fw-500'>{note.notesContent}</p>
            }
            {editNote && 
                <div className='d-flex gap-16px'>
                   <button onClick={(e)=>{handleNoteUpdate()}} 
                    className='primary-btn py-10px w-64px h-40px d-flex-center'>Save</button>
                    <button onClick={()=>{
                        setEditNote(false);
                        setEditNoteInput(note.notesContent);
                        setNotesError(false);
                    }} className='secondary-btn w-80px py-10px px-16px h-40px d-flex-center'>Cancel</button>
                </div>}
          
        </div>
    )
}

export default Notes;
