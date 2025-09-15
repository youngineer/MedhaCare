import { useNavigate } from "react-router-dom"
import authServices from "../services/authServices";
import type { IAlert } from "../types/interfaces";
import { useState } from "react";
import AlertDialog from "./AlertDialog";



const Navbar = () => {
    const navigate = useNavigate();
    const [alert, setAlert] = useState<IAlert | null>(null);
    

    async function handleLogout(): Promise<void> {
        try {
            const response = await authServices.logout();
            setAlert({isError: false, message: response?.message});
            setTimeout(() => {
                setAlert(null);
            }, 2000);
            navigate("/auth");
        } catch (error: any) {
            setAlert({isError: true, message: error.message});
            setTimeout(() => {
                setAlert(null);
            }, 2000);

            console.error(error);
        }
    }

    return (
        <div>
            <div className="fixed navbar bg-neutral text-neutral-content shadow-sm">
                <div className="flex-1">
                    <a className="btn btn-ghost text-xl">mindCare</a>
                </div>
                <div className="flex gap-2">
                    <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                        <div className="w-10 rounded-full">
                        <img
                            alt="Tailwind CSS Navbar component"
                            src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
                        </div>
                    </div>
                    <ul
                        tabIndex={0}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-1 mt-3 w-52 p-2 shadow">
                        <li onClick={() => navigate("")}><a>Your Profile</a></li>
                        <li onClick={handleLogout}><a>Logout</a></li>
                    </ul>
                    </div>
                </div>
                {alert && (<AlertDialog {...alert} />)}
            </div>
        
        </div>
    )
}

export default Navbar