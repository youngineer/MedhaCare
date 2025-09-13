import { useState, type ChangeEvent } from 'react'
import type { ILogin, ISignup } from '../types/interfaces';
import authServices from '../services/authServices';



const AuthPage = () => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [signupPayload, setSignupPayload] = useState<ISignup>({
    name: "",
    emailId: "",
    password: "",
    confirmPassword: "",
    role: "patient"
  });

  const [loginPayload, setLoginPayload] = useState<ILogin>({
    emailId: "dr.ashwin@therapycenter.com",
    password: "Ashwin@123"

    // emailId: "p@gmail.com",
    // password: "P@123"
  });


  function handleInputChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void {
    const target = e.target as HTMLInputElement | HTMLSelectElement;
    const { name, value } = target;

    if(isLogin) {
      setLoginPayload((prev) => ({
        ...prev,
        [name]: value
      }));
    } else {
      setSignupPayload(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }


  async function handleFormSubmit(): Promise<void> {
    try {
      let response = null;

      if(isLogin) {
        response = await authServices.login(loginPayload);
      } else {
        response = await authServices.signup(signupPayload);
      }

      if(!response) throw new Error("Error connecting");
    } catch (error) {
      
    }
  }


  return (
    <div>
      <div className="card lg:card-side bg-base-100 shadow-sm">
        <div className="card-body">
          <fieldset className="fieldset bg-base-200 border-base-300 rounded-box w-xs border p-4">
            <legend className="fieldset-legend text-lg">{isLogin? "Login": "Signup"} Form</legend>

            {
              !isLogin && (
                <div>
                  <label className="label">Name</label>
                  <input name="name" type="text" className="input" placeholder="Suresh Nambiar" onChange={handleInputChange} value={signupPayload.name}/>
                </div>
              )
            }

            <label className="label">Email</label>
            <input name="emailId" type="email" className="input" placeholder="suresh.nambiar@gmail.com" onChange={handleInputChange} value={isLogin? loginPayload.emailId: signupPayload.emailId}/>

            <label className="label">Password</label>
            <input name="password" type="password" className="input" placeholder="Password" onChange={handleInputChange} value={isLogin? loginPayload.password : signupPayload.password}/>

            {
              !isLogin && (
                <div>
                  <label className="label my-2">Confirm Password</label>
                  <input name="confirmPassword" type="password" className="input" placeholder="Confirm Password" onChange={handleInputChange} value={signupPayload.confirmPassword}/>

                  <label className="label my-2">Registering as</label>
                  <select name="role" value={signupPayload.role} className="select" onChange={handleInputChange}>
                    <option value="patient">Patient</option>
                    <option value="therapist">Therapist</option>
                  </select>
                </div>
              )
            }

            <h5 className='cursor-pointer items-center' onClick={() => setIsLogin(prev => !prev)}>{isLogin? "New User? Signup": "Already a user? Login"}</h5>
            <button className="btn btn-neutral mt-4" onClick={handleFormSubmit}>{isLogin ? 'Login' : 'Signup'}</button>
          </fieldset>
        </div>
      </div>
    </div>
  )
}

export default AuthPage