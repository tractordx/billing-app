export function DownloadButton({ fileName, data }) {
  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([data], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  return (
    <button onClick={handleDownload} className="btn-primary">
      Download
    </button>
  );
}
