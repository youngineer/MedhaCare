import { useState, type ChangeEvent } from 'react'
import type { IAlert, ILogin, ISignup } from '../types/interfaces';
import authServices from '../services/authServices';
import { useNavigate } from 'react-router-dom';
import AlertDialog from './AlertDialog';
import { useAppDispatch } from '../utils/hooks';
import { setUser } from '../utils/userSlice';

const AuthPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [alert, setAlert] = useState<IAlert | null>(null);
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
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
        setIsLoading(true);
        setAlert(null);
        
        // Form validation...
        if (isLogin) {
            if (!loginPayload.emailId || !loginPayload.password) {
                throw new Error("Please fill in all fields");
            }
        } else {
            if (!signupPayload.name || !signupPayload.emailId || !signupPayload.password || !signupPayload.confirmPassword) {
                throw new Error("Please fill in all fields");
            }
            if (signupPayload.password !== signupPayload.confirmPassword) {
                throw new Error("Passwords do not match");
            }
        }

        const response = await (isLogin ? authServices.login(loginPayload) : authServices.signup(signupPayload));
        
        if (!response) {
            throw new Error("No response from server");
        }

        console.log('Auth response:', response);
        
        // ✅ FIX: Handle both login (has content) and signup (might not have content)
        if (isLogin && response.content && Object.keys(response.content).length > 0) {
          // Login successful with user data
          dispatch(setUser(response.content));
          setAlert({ isError: false, message: response.message || "Login successful!" });

          const user = response.content as any;
          const userRole = response.role || user.role || 'patient';
          
          setTimeout(() => {
            switch(userRole) {
                case 'admin':
                    navigate('/admin/dashboard');
                    break;
                case 'therapist':
                    navigate('/therapist/dashboard');
                    break;
                case 'patient':
                default:
                    navigate('/patient/profile');
                    break;
              }
          }, 1500);
        } else if (!isLogin) {
            // Signup successful - just show message, don't navigate
            setAlert({ isError: false, message: response.message || "Signup successful! Please login." });
            setTimeout(() => setIsLogin(true), 2000); // Switch to login form
        } else {
            throw new Error(response.message || "Authentication failed - no user data received");
        }

    } catch (error: any) {
        console.error('Auth error:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setAlert({ isError: true, message: errorMessage });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div>
      <div className="hero bg-base-200 min-w-2xl">
        <div className="hero-content flex-col lg:flex-row-reverse">
          <div className="text-center lg:text-left">
            <h1 className="text-5xl font-bold">{isLogin? "Login": "Signup"} now!</h1>
          </div>
          <div className="card w-full max-w-sm shrink-0 shadow-2xl">
            <div className="card-body">
              <fieldset className="fieldset bg-base-300 border-base-300 rounded-box w-xs border p-4">

                {
                  !isLogin && (
                    <div>
                      <label className="label">Name</label>
                      <input 
                        name="name" 
                        type="text" 
                        className="input" 
                        placeholder="Suresh Nambiar" 
                        onChange={handleInputChange} 
                        value={signupPayload.name}
                        disabled={isLoading}
                      />
                    </div>
                  )
                }

                <label className="label">Email</label>
                <input 
                  name="emailId" 
                  type="email" 
                  className="input" 
                  placeholder="suresh.nambiar@gmail.com" 
                  onChange={handleInputChange} 
                  value={isLogin? loginPayload.emailId: signupPayload.emailId}
                  disabled={isLoading}
                />

                <label className="label">Password</label>
                <input 
                  name="password" 
                  type="password" 
                  className="input" 
                  placeholder="*******" 
                  onChange={handleInputChange} 
                  value={isLogin? loginPayload.password : signupPayload.password}
                  disabled={isLoading}
                />

                {
                  !isLogin && (
                    <div>
                      <label className="label my-2">Confirm Password</label>
                      <input 
                        name="confirmPassword" 
                        type="password" 
                        className="input" 
                        placeholder="*******" 
                        onChange={handleInputChange} 
                        value={signupPayload.confirmPassword}
                        disabled={isLoading}
                      />

                      <label className="label my-2">Registering as</label>
                      <select 
                        name="role" 
                        value={signupPayload.role} 
                        className="select" 
                        onChange={handleInputChange}
                        disabled={isLoading}
                      >
                        <option value="patient">Patient</option>
                        <option value="therapist">Therapist</option>
                      </select>
                    </div>
                  )
                }

                <h5 
                  className="btn btn-link" 
                  onClick={() => !isLoading && setIsLogin(prev => !prev)}
                >
                  {isLogin? "New User? Signup": "Already a user? Login"}
                </h5>
                <button 
                  className="btn btn-neutral mt-4" 
                  onClick={handleFormSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      {isLogin ? 'Logging in...' : 'Signing up...'}
                    </>
                  ) : (
                    isLogin ? 'Login' : 'Signup'
                  )}
                </button>
              </fieldset>
            </div>
          </div>
        </div>
      </div>
      {alert && (<AlertDialog {...alert} />)}
    </div>
  )
}

export default AuthPage