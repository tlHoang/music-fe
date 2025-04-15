"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendRequest } from "@/utils/api";
import { useParams } from "next/navigation";
import { toast } from "sonner";

const VerifyPage = () => {
  const params = useParams<{ id: string }>();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await sendRequest<IBackendRes<undefined>>({
      url: `${process.env.NEXT_PUBLIC_API_URL}/auth/verify`,
      method: "PUT",
      body: {
        _id: params?.id,
        code: formData.get("code") as string,
      },
    });
    if (res.statusCode === 200) {
      console.log("Account activated successfully!");
    } else {
      toast.error(res.message);
    }
    console.log(res);
  };

  const handleResend = async () => {
    const res = await sendRequest<IBackendRes<undefined>>({
      url: `${process.env.NEXT_PUBLIC_API_URL}/auth/resend-verify`,
      method: "PUT",
      body: {
        _id: params?.id,
      },
    });
  };
  return (
    <>
      <form onSubmit={handleSubmit}>
        <Label htmlFor="code">Verification Code</Label>
        <Input
          name="code"
          id="code"
          type="text"
          placeholder="Verification Code"
          required
        />
        <Button type="submit" className="cursor-pointer">
          Verify
        </Button>
        <Button
          variant={"secondary"}
          type="button"
          onClick={handleResend}
          className="cursor-pointer"
        >
          Resend
        </Button>
      </form>
    </>
  );
};
export default VerifyPage;
