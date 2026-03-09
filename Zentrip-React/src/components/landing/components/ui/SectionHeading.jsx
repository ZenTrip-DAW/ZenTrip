export default function SectionHeading({ children }) {
  return (
    <h2 className="text-4xl font-extrabold text-blue-900 leading-tight mb-4" style={{ fontFamily: "'Georgia', serif" }}>
      {children}
    </h2>
  );
}
