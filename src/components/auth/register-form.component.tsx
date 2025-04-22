"use client";

import { sendRequest } from "@/utils/api";
import { useRouter } from "next/navigation";

interface IRegister {
  _id: string;
}

const RegisterForm = () => {
  const router = useRouter();
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const res = await sendRequest<IBackendRes<IRegister>>({
      url: `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
      method: "POST",
      body: {
        username: formData.get("username") as string,
        email: formData.get("email") as string,
        password: formData.get("password") as string,
      },
    });
    if (res.ok) {
      // TODO: handle success, e.g., redirect to login page or show success message
      router.push(`/verify/${res.data?._id}`);
      // console.log("Registration successful:", res.data);
    } else {
      // TODO: handle error, e.g., show error message
    }
  };

  return (
    <>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <input type="text" name="username" placeholder="Username" required />
        <input type="email" name="email" placeholder="Email" required />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button type="submit">Register</button>
      </form>
    </>
  );
};

export default RegisterForm;
