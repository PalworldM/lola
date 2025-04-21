import { Routes, Route, useSearchParams, useLocation } from '@solidjs/router';
import { createEffect, createSignal, ErrorBoundary, lazy, Suspense } from 'solid-js';
import { useUser } from './contexts/usercontextprovider';
import Sidebar from './components/SideBar/sidebar';
import { authedAPI, closeDropdowns, createNotification } from './util/api';
import Navbar from './components/NavBar/navbar';
import { Toaster } from 'solid-toast';
import Loader from './components/Loader/loader';
import LoadingScreen from './components/Loader/loadingscreen';
import { Redirect } from './util/redirect';
import { useWebsocket } from './contexts/socketprovider';
import { ADMIN_ROLES } from './resources/users';
import Footer from './components/Footer/footer';
import Freecoins from './components/Freecoins/freecoins';
import Rakeback from './components/Rakeback/rakeback';
import AML from './components/Documentation/aml';
import UserModal from './components/UserPopup/userpopup';

const Admin = lazy(() => import('./pages/admin'));
const AdminDashboard = lazy(() => import('./components/Admin/dashboard'));
const AdminUsers = lazy(() => import('./components/Admin/users'));
const AdminStatistics = lazy(() => import('./components/Admin/statistics'));
const AdminFilter = lazy(() => import('./components/Admin/filter'));
const AdminCashier = lazy(() => import('./components/Admin/cashier'));
const AdminRain = lazy(() => import('./components/Admin/rain'));
const AdminStatsbook = lazy(() => import('./components/Admin/statsbook'));
const AdminSettings = lazy(() => import('./components/Admin/settings'));

const Mines = lazy(() => import('./pages/mines'));
const Crash = lazy(() => import('./pages/crash'));
const Slot = lazy(() => import('./pages/slot'));
const Slots = lazy(() => import('./pages/slots'));

const Surveys = lazy(() => import('./pages/surveys'));

const Docs = lazy(() => import('./pages/docs'));
const TOS = lazy(() => import('./components/Documentation/tos'));
const Privacy = lazy(() => import('./components/Documentation/privacy'));
const Provably = lazy(() => import('./components/Documentation/provably'));
const FAQ = lazy(() => import('./components/Documentation/faq'));

const SignIn = lazy(() => import('./components/Signin/signin'));

const Home = lazy(() => import('./pages/home'));

const Profile = lazy(() => import('./pages/profile'));
const Transactions = lazy(() => import('./components/Profile/transactions'));
const History = lazy(() => import('./components/Profile/history'));
const Settings = lazy(() => import('./components/Profile/settings'));

const Deposit = lazy(() => import('./pages/deposits'));
const Withdraws = lazy(() => import('./pages/withdraws'));

const Leaderboard = lazy(() => import('./pages/leaderboard'));
const Affiliates = lazy(() => import('./pages/affiliates'));

const Coinflips = lazy(() => import('./pages/coinflips'));
const Roulette = lazy(() => import('./pages/roulette'));
const Jackpot = lazy(() => import('./pages/jackpot'));

const Battles = lazy(() => import('./pages/battles'));
const Battle = lazy(() => import('./pages/battle'));
const CreateBattle = lazy(() => import('./pages/createbattle'));

const Cases = lazy(() => import('./pages/cases'));
const CasesPage = lazy(() => import('./components/Cases/casespage'));
const CasePage = lazy(() => import('./components/Cases/casepage'));

function App() {
  let pageContent;
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [user, { hasFetched, setBalance, setXP, getUser }] = useUser();
  const [ws] = useWebsocket();
  const [chat, setChat] = createSignal(false);

  createEffect(() => {
    if (location.pathname && pageContent) {
      pageContent.scrollTo({ top: 0 });
    }
  });

  createEffect(() => {
    if (ws() && ws().connected) {
      ws().on('balance', (type, amount, delay) => {
        if (type === 'set') {
          setTimeout(() => setBalance(amount), +delay || 0);
        }
        if (type === 'add') {
          setTimeout(() => setBalance(user()?.balance + amount), +delay || 0);
        }
      });

      ws().on('xp', (xp) => {
        setXP(xp);
      });

      ws().on('coinflip:own:started', (flip) => {
        if (!user()) return;
        let isCreator = flip[flip.ownerSide]?.id === user()?.id;
        let creatorWon = flip.winnerSide === flip.ownerSide;

        if ((isCreator && !creatorWon) || (!isCreator && creatorWon)) return;
      });
    }
  });

  createEffect(async () => {
    try {
      if (!hasFetched()) return;

      if (!user() && searchParams.a) {
        setSearchParams({ a: null, modal: 'login' });
        localStorage.setItem('aff', searchParams.a);
        return;
      }

      if (user() && searchParams.a) {
        setSearchParams({ a: null });

        let res = await authedAPI('/user/affiliate', 'POST', JSON.stringify({
          code: searchParams.a
        }), true);

        if (res.success) {
          createNotification('success', `Successfully redeemed affiliate code ${searchParams.a}.`);
        }
      }
    } catch (e) {
      console.error(e);
      setSearchParams({ a: null });
    }
  });

  return (
    <>
      {!hasFetched() ? (
        <LoadingScreen />
      ) : (
        <>
          <Toaster
            position='bottom-right'
          />

          {searchParams.modal === 'login' && !user() && (
            <SignIn ws={ws} />
          )}

          {searchParams.modal === 'freecoins' && user() && (
            <Freecoins ws={ws} />
          )}

          {searchParams?.modal === 'rakeback' && user() && (
            <Rakeback ws={ws} user={user()} />
          )}

          {searchParams?.user && (
            <UserModal user={user()} />
          )}

          <ErrorBoundary
            fallback={err => {
              console.log(err.message);
              if (err.message.includes('dynamically imported module')) {
                return window.location.reload();
              }

              return (
                <>
                  <p>An error has occurred. Please press f12, copy the red text in the console, and report
                    this.</p>
                  {console.log(err)}
                </>
              );
            }}>
            <div class='app' onClick={() => closeDropdowns()}>
              <Sidebar chat={chat()} setChat={setChat} />
              <div class='center' ref={pageContent}>
                <Navbar user={user()} chat={chat()} setChat={setChat} />

                <div class='content'>
                  <Routes>
                    <Route path='/' element={
                      <Suspense fallback={<Loader />}>
                        <Home user={user()} />
                      </Suspense>
                    } />

                    <Route path='/surveys' element={
                      <Suspense fallback={<Loader />}>
                        <Surveys user={user()} />
                      </Suspense>
                    } />

                    {/* Other routes can go here */}

                  </Routes>

                  <div class='background' />
                </div>

                <Footer />
              </div>
            </div>
          </ErrorBoundary>
        </>
      )}

      <style jsx>{`
        .app {
          width: 100vw;
          height: 100vh;

          display: flex;

          position: relative;
          overflow: hidden;
          scrollbar-color: transparent transparent;
        }

        .center {
          height: 100vh;
          width: 100%;
          position: relative;
          overflow: auto;
          scrollbar-color: transparent transparent;
        }

        .center::-webkit-scrollbar {
          display: none;
        }

        .content {
          width: 100%;
          min-height: calc(100% - 130px);

          position: relative;
          padding: 0 25px;
          scrollbar-color: transparent transparent;
        }

        .content::-webkit-scrollbar {
          display: none;
        }

        .background {
          position: absolute;
          max-width: 1500px;
          top: 0;
          left: 50%;
          transform: translateX(-50%);

          height: 100%;
          width: 100%;

          background-image: url("/assets/art/background.png");
          mix-blend-mode: luminosity;
          z-index: -1;

          background-repeat: no-repeat;
          background-position: center;
          background-size: contain;
        }

        .app::-webkit-scrollbar {
          display: none;
        }

        @media only screen and (max-width: 1000px) {
          .center {
            padding-bottom: 50px;
          }
        }
      `}</style>
    </>
  );
}

export default App;
