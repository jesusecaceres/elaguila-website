export default function NotFound() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        fontSize: "24px",
        fontWeight: "bold",
      }}
    >
      Página no encontrada / Page not found
    </div>
  );
}

export const dynamic = "force-dynamic";
export const revalidate = 0;
