import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/user.context';
import { useLocation } from 'react-router-dom';
import axios from '../config/axios';
import { initializeSocket, recieveMessage, sendMessage } from '../config/socket.js';

const Project = ()=> {
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(new Set());
    const location = useLocation();
    const [users, setUsers] = useState([]);
    const [project, setProject] = useState(location.state.project);
    const [message, setMessage] = useState('');
    const { user } = useContext(UserContext);
    const messageBox=React.createRef()

    const handleUserClick = (id) => {
        setSelectedUserId(prevSelectedUserId => {
            const newSelectedUserId = new Set(prevSelectedUserId);
            if (newSelectedUserId.has(id)) {
                newSelectedUserId.delete(id);
            } else {
                newSelectedUserId.add(id);
            }
            return newSelectedUserId;
        });
    };

    const send = () => {
        if (message.trim()) {
            sendMessage('project-message', { message, sender: user });
            appendOutgoingMessage(message);
            setMessage('');
        }
    };

    useEffect(() => { 
        initializeSocket(project._id);
    
        const messageHandler = (data) => {
            if (data.sender.email !== user.email) {
                appendIncomingMessage(data);
            }
        };
    
        recieveMessage('project-message', messageHandler);
    
        axios.get(`/projects/get-project/${location.state.project._id}`).then(res => {
            setProject(res.data.project);
        });
    
        axios.get('/users/all').then(res => {
            setUsers(res.data.users);
        }).catch(err => {
            console.log(err);
        });
    
        return () => {
            // Cleanup function to prevent duplicate event listeners
            recieveMessage('project-message', messageHandler, true); 
        };
    }, []);
    
    function appendIncomingMessage(messageObject) {
        const messageBox = document.querySelector('.message-box');
        const message = document.createElement('div');
        const isCurrentUser = messageObject.sender.email === user.email;
        
        message.classList.add('message', 'max-w-56', 'flex', 'flex-col', 'min-w-6', 'p-2', 'bg-slate-50', 'w-fit', 'rounded-md', 'mb-2');
        
        if (isCurrentUser) {
            message.classList.add('ml-auto');
        }
        
        message.innerHTML = `
            <small class='opacity-65 text-xs'>${messageObject.sender.email}</small>
            <p class='text-sm'>${messageObject.message}</p>
        `;
        
        messageBox.appendChild(message);
        messageBox.scrollTop = messageBox.scrollHeight;
        scrollToBottom()
    } 


    function appendOutgoingMessage(message){
        const messageBox = document.querySelector('.message-box');
        const newMessage = document.createElement('div');
        newMessage.classList.add('ml-auto', 'max-w-56', 'flex', 'flex-col', 'min-w-6', 'p-2', 'bg-slate-50', 'w-fit', 'rounded-md', 'mb-2');
        
        newMessage.innerHTML = `
            <small class='opacity-65 text-xs'>${user.email}</small>
            <p class='text-sm'>${message}</p>
        `;
        
        messageBox.appendChild(newMessage);
        scrollToBottom()

    }

    function addCollaborators() {
        axios.put('/projects/add-user', {
            projectId: location.state.project._id,
            users: Array.from(selectedUserId)
        }).then(res => {
            console.log(res.data)
            setIsModalOpen(false);
        }).catch(err => {
            console.log(err);
        });
    }

function scrollToBottom(){
    messageBox.current.scrollTop = messageBox.current.scrollHeight
}


    return (
        <main className='h-screen w-screen flex'>
            <section className='left relative flex flex-col h-full min-w-96 bg-slate-200'>
                <header className='flex justify-between items-center p-2 px-4 w-full bg-slate-300'>
                    <button className='flex gap-2' onClick={() => setIsModalOpen(true)}>
                        <i className='ri-add-fill mr-1'></i>
                        <p>Add Collaborators</p>
                    </button>
                    <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'>
                        <i className='ri-group-fill'></i>
                    </button>
                </header>

                <div className="conversation-area pt-14 pb-10 flex-grow flex flex-col h-full relative">
                    <div ref={messageBox} className='message-box p-1 flex-grow flex flex-col gap-1 overflow-auto max-h-full scrollbar-hide'>
                       
                    </div>
                    <div className='className="inputField w-full flex absolute bottom-0 bg-slate-50'>
                        <input value={message} onChange={(e) => setMessage(e.target.value)} className='p-2 px-4 border-none outline-none flex-grow' type="text" placeholder='Enter message' />
                        <button className='px-5 bg-slate-950 text-white' onClick={send}><i  className='ri-send-plane-fill'></i></button>
                    </div>
                </div>

                <div className={`sidePanel w-full h-full bg-slate-100 absolute flex flex-col gap-2 transition-all ${isSidePanelOpen ? 'translate-x-0' : '-translate-x-full'} top-0`}>
                    <header className='flex justify-between items-center px-3 p-2 bg-slate-200'>
                        <h1 className='font-semibold'>Collaborators</h1>
                        <button onClick={() => setIsSidePanelOpen(!isSidePanelOpen)} className='p-2'><i className='ri-close-fill'></i></button>
                    </header>
                    <div className="users flex flex-col gap-2">
                        {project.users && project.users.map(user => (
                            <div key={user._id} className="user flex cursor-pointer hover:bg-slate-200 p-2 gap-2 items-center">
                                <div className='aspect-square rounded-full w-fit flex items-center justify-center h-fit p-5 text-white bg-slate-600 '>
                                    <i className='ri-user-fill absolute'></i>
                                </div>
                                <h1 className='font-light '>{user.email}</h1>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                    <div className="bg-white p-4 rounded-lg w-96">
                        <header className='flex justify-between items-center mb-4'>
                            <h2 className='text-xl font-semibold'>Select User</h2>
                            <button onClick={() => setIsModalOpen(false)} className='p-2'>
                                <i className="ri-close-fill"></i>
                            </button>
                        </header>
                        <div className="users-list flex flex-col gap-2 mb-16 max-h-96 overflow-auto">
                            {users.map(user => (
                                <div key={user._id} className={`user cursor-pointer hover:bg-slate-400 ${selectedUserId.has(user._id) ? 'bg-slate-400' : ""} p-2 flex gap-2 items-center`} onClick={() => handleUserClick(user._id)}>
                                    <div className='aspect-square relative rounded-full w-fit h-fit flex items-center justify-center p-5 text-white bg-slate-600'>
                                        <i className="ri-user-fill absolute"></i>
                                    </div>
                                    <h1 className='font-medium '>{user.email}</h1>
                                </div>
                            ))}
                        </div>
                        <button onClick={addCollaborators} className='absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-blue-600 text-white rounded-md'>
                            Add Collaborators
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}

export default Project;