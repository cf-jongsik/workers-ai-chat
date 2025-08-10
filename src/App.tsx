import { ChatPage } from "./ChatPage";
import "./App.css";
import { LocaleProvider } from "@chatui/core";

function App() {
  return (
    <LocaleProvider locale="en-US">
      <ChatPage />
    </LocaleProvider>
  );
}

export default App;
