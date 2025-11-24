import { useNavigate } from "react-router-dom";

function LoginPage() {
  const navigate = useNavigate();

  function handleLogin() {
    navigate("/dashboard");
  }

  return (
  <div className="text-center ">
    <h1 className="text-4xl mt-10 font-black">Logg inn</h1>
    <input id="username" className="bg-gray-600 mt-25 text-center p-2 rounded-xl" type="text" placeholder="Username" /><br />
    <input id="password" className="bg-gray-600 mt-5 text-center p-2 rounded-xl" type="text" placeholder="Password" /><br />
    <button onClick={handleLogin} className="mt-10 bg-gray-600 px-5 py-3 rounded-xs hover:bg-gray-400 transition-color">Logg Inn</button>

</div>
  );
}

export default LoginPage;
