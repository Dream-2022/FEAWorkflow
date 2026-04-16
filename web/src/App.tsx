import { useEffect } from "react";

function App() {
  useEffect(() => {
    fetch("/api/health")
      .then((res) => res.text())
      .then((data) => {
        console.log("后端返回：", data);
      })
      .catch((err) => {
        console.error("请求失败：", err);
      });
  }, []);

  return <div>Frontend Agent Workflow</div>;
}

export default App;
