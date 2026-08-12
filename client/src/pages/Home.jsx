import { Link } from 'react-router-dom';
import Image from '/Home.png';

const Home = () => (
  <div className="min-h-[calc(100vh-64px)] bg-gradient-to-r from-cyan-500 via-cyan-600 to-pink-500">
    <div className="container mx-auto flex flex-col items-center justify-center py-16 md:flex-row md:py-0 md:min-h-[calc(100vh-64px)]">
      <div className="md:w-1/2">
        <h1 className="p-6 text-4xl font-bold text-center text-white md:p-24 md:text-5xl md:text-left">
          Connecting People, Empowering Teams: Your Ultimate HR Toolkit.
        </h1>
        <p className="p-6 text-lg font-medium text-center text-white/90 md:pl-24 md:pr-2 md:text-left">
          Unlock organisational success with our HR Copilot AI — powered by your
          company&apos;s own policy documents.
        </p>
        <div className="flex justify-center gap-4 px-6 pb-6 md:justify-start md:px-24">
          <Link
            to="/login"
            className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-cyan-600"
          >
            Sign in
          </Link>
          <Link
            to="/register"
            className="rounded-lg border border-white/70 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-cyan-600"
          >
            Get started
          </Link>
        </div>
      </div>
      <div className="flex justify-center md:w-1/2">
        <img
          src={Image}
          alt="HR team collaborating on a platform"
          className="max-h-96 object-contain"
        />
      </div>
    </div>
  </div>
);

export default Home;
