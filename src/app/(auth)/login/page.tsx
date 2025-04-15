"use client";
import LoginForm from "@/components/auth/login-form.component";
import ReactiveModal from "@/components/auth/reactive-modal.component";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const LoginPage = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <LoginForm setReactiveModalState={setIsOpen} />
      {/* <Button onClick={() => setIsOpen(!isOpen)} className="mt-4">
        Open Modal
      </Button> */}
      <ReactiveModal isOpen={isOpen} setIsOpen={setIsOpen} />
    </>
  );
};

export default LoginPage;
