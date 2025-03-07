import React, { useContext, useState,useEffect } from 'react';
import { UserContext } from '../context/user.context';
import axios from '../config/axios'
import { getProjectById } from '../../../../backend/db/services/project.service';
import {useNavigate} from 'react-router-dom'
const Home = () => {

  const { user } = useContext(UserContext);
  const [isModalOpen, setModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [project, setProject] = useState([])
  const navigate=useNavigate();

  function createProject(event) {
    event.preventDefault();
    console.log('Creating project:', projectName);
    

    axios.post('/projects/create',{
      name: projectName,
    
    }).then((res)=>{console.log(res)
      setModalOpen(false)
    }).catch((err)=>{console.log(err)});
  }
  useEffect(() => {
    axios.get('/projects/all').then((res) => {
        setProject(res.data.projects)

    }).catch(err => {
        console.log(err)
    })

}, [])
  return (
    <main className='p-4'>
      <div className='projects flex flex-wrap gap-3'>
        <button
          className='project p-4 border border-slate-300 rounded-md flex items-center space-x-2'
          onClick={() => setModalOpen(true)}
        >
          <i className='ri-link'></i>
          <span>New Project</span>
        </button>
        {
          project.map((project) =>(
           <div key={project._id} onClick= {()=>{navigate('/project',{
            state:{project}
           })}}   className="project  min-w-53 hover:bg-slate-200 flex flex-col gap-2 cursor-pointer p-4 border border-slate-300 rounded-md">
            <h2 className='font-semibold '>{project.name}</h2>
            <div className='flex gap-2'>
              <p><i className="ri-user-line"></i> <small>Collaborators:</small></p>
            {project.users.length}
           </div>
           </div>
           
          ))
        }
      </div>

      {isModalOpen && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='bg-white p-6 rounded-lg shadow-lg w-96'>
            <h2 className='text-lg font-semibold mb-4'>Create Project</h2>
            <form onSubmit={createProject}>
              <input
                type='text'
                className='w-full p-2 border border-gray-300 rounded mb-4'
                placeholder='Enter project name'
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                required
              />
              <div className='flex justify-end space-x-2'>
                <button
                  type='button'
                  className='px-4 py-2 bg-gray-300 rounded hover:bg-gray-400'
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  className='px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
};

export default Home;