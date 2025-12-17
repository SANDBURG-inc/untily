interface SubmitPageHeaderProps {
  title: string;
  description?: string;
}

export default function SubmitPageHeader({ title, description }: SubmitPageHeaderProps) {
  return (
    <div className="text-center mb-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">{title}</h1>
      {description && (
        <p className="text-gray-500">{description}</p>
      )}
    </div>
  );
}
