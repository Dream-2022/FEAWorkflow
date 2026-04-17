import { Layout } from "antd";
import { Header } from "../components/Header";
import { FilePanel } from "../components/FilePanel";
import { TaskPanel } from "../components/TaskPanel";
import { ResultPanel } from "../components/ResultPanel";

const { Sider, Content } = Layout;

export function WorkbenchLayout() {
  return (
    <Layout style={{ height: "100vh" }}>
      <Header />
      <Layout>
        <Sider
          width={400}
          theme="light"
          style={{ overflow: "auto", borderRight: "1px solid #f0f0f0" }}
        >
          <div style={{ padding: "16px" }}>
            <FilePanel />
            <div style={{ height: "16px" }} />
            <TaskPanel />
          </div>
        </Sider>
        <Content
          style={{ overflow: "auto", background: "#f5f5f5", padding: "16px" }}
        >
          <ResultPanel />
        </Content>
      </Layout>
    </Layout>
  );
}
