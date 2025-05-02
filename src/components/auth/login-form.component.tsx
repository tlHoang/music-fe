import { signIn } from "next-auth/react";
// import { toast } from "react-toastify"
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface IProps {
  setReactiveModalState?: (state: boolean) => void;
}

const LoginForm = (props: IProps) => {
  const { setReactiveModalState } = props;
  const router = useRouter();
  const credentialsAction = async (formData: FormData) => {
    const { email, password } = Object.fromEntries(formData.entries());
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        if (result.code === "InvalidEmailOrPassword") {
          toast.error("Invalid email or password");
        } else if (result.code === "AccountIsNotActivated") {
          toast.error("Account is not activated");
          setReactiveModalState?.(true);
        } else {
          toast.error("Invalid credentials");
        }
      } else {
        toast.success("Login successful");
        router.push("/homepage");
      }
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  return (
    <>
      <form
        onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          await credentialsAction(formData);
        }}
      >
        <label htmlFor="credentials-email">
          Email
          <input type="email" id="credentials-email" name="email" required />
        </label>
        <label htmlFor="credentials-password">
          {" "}
          Password
          <input
            type="password"
            id="credentials-password"
            name="password"
            required
          />
        </label>
        <input type="submit" value="Sign In" />
      </form>
    </>
  );
};

export default LoginForm;
