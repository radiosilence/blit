export type PageData = {
  formData: Record<string, string> | null;
  userAgent: string;
  acceptLanguage: string;
  host: string;
  url: string;
  time: string;
};

export function SsrDebug({ data }: { data: PageData }) {
  const { formData, ...info } = data;

  return (
    <section className="m-12 max-w-screen-sm mx-auto space-y-6">
      <div className="text-center space-y-4">
        {formData?.name && (
          <p className="text-xl">
            hey, <strong>{formData.name}</strong>
          </p>
        )}
        <form method="POST" className="flex gap-2 justify-center">
          <input
            name="name"
            placeholder="your name, choom"
            defaultValue={formData?.name || ""}
            className="border border-brand-mid px-3 py-1 bg-transparent text-sm"
          />
          <button type="submit" className="border border-brand px-3 py-1 text-sm text-brand">
            go
          </button>
        </form>
      </div>

      <div className="text-xs opacity-40">
        <h3>ssr debug</h3>
        <table className="w-full">
          <tbody>
            {formData && (
              <tr>
                <td className="font-semibold pis-0">POST body</td>
                <td className="break-all">{JSON.stringify(formData)}</td>
              </tr>
            )}
            {Object.entries(info).map(([k, v]) => (
              <tr key={k}>
                <td className="font-semibold pis-0">{k}</td>
                <td className="break-all">{String(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
