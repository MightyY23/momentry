import AppRouter from "./routes/AppRouter";

import CommandPalette from "./components/CommandPalette/CommandPalette";

import useMoments from "./hooks/useMoments";


function GlobalSearch() {
  const { moments } = useMoments();

  return (
    <CommandPalette moments={moments} />
  );
}

function App() {
  return (
    <>
      <AppRouter />

      <GlobalSearch />
    </>
  );
}

export default App;
