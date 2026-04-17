import { Layout, Badge } from "antd";
import { env } from "../../config/env";

const { Header: AntHeader } = Layout;

export function Header() {
  return (
    <AntHeader
      style={{
        background: "#fff",
        padding: "0 24px",
        borderBottom: "1px solid #f0f0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: "20px", fontWeight: 600, color: "#1f2937" }}>
        {env.VITE_APP_NAME}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <Badge status="success" text="就绪" />
      </div>
    </AntHeader>
  );
}
