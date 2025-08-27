import Header from "./_components/Header"
import EditorPanel from "./_components/EditorPanel";
import OutputPanel from "./_components/OutputPanel";

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="max-w-[1800px] mx-auto px-4 pb-4">
        <Header />
          <div className="min-w-full grid lg-grid-cols grid-cols-2 gap-4">
            <EditorPanel />
            <OutputPanel />
          </div>
      </div>
    </div>
  );
}
