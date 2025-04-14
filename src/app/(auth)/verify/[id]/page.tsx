'use client';
import { sendRequest } from "@/utils/api";
import { useParams } from "next/navigation";

const VerifyPage = () => {
  const params = useParams<{ id: string }>();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await sendRequest<IBackendRes<undefined>>({
      url: `${process.env.NEXT_PUBLIC_API_URL}/auth/verify`,
      method: "POST",
      body: {
        _id: params?.id,
        code: formData.get("code") as string,
      },
    });
    console.log(res);
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <input type="text" name="code" placeholder="Verification Code" required />
        <button type="submit">Verify</button>
      </form>
    </>
  );
}
export default VerifyPage;