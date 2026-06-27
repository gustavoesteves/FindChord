import { WriterProvider } from "./context/WriterContext";
import WriterTabSurface from "./components/WriterTabSurface";

export default function WriterScreen() {
  return (
    <WriterProvider>
      <WriterTabSurface />
    </WriterProvider>
  );
}
