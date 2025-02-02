import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import { useNavigate } from 'react-router-dom';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import Loader from "@/components/shared/Loader";
import { useToast } from "@/hooks/use-toast";
import { useSignInAccount } from "@/lib/react-query/queriesandmutation";
import { useUserContext } from "@/context/AuthContext";
import { SigninValidation } from "@/lib/validation";

const SigninForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { checkAuthUser, isLoading: isUserLoading } = useUserContext();
  

  const { mutateAsync: signInAccount } = useSignInAccount();

  const form = useForm<z.infer<typeof SigninValidation>>({
    resolver: zodResolver(SigninValidation),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof SigninValidation>) {
    try {
      const Session = await signInAccount({
        email: values.email,
        password: values.password,
     });
     
    console.log("Session returned from signInAccount:", Session); 
    console.log("session created");

      if (!Session) {
        return toast({ title: "Sign in failed. Please try again." });
      }
      console.log("session created");

      const isLoggedIn = await checkAuthUser();
      console.log(isLoggedIn);

      console.log("Is user logged in?", isLoggedIn);

      if (isLoggedIn) {
        form.reset();

        console.log("navigating")

        navigate('/');
        
      } else {
        return toast({ title: "Sign in failed. Please try again." });
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      toast({ title: "Something went wrong. Try again!" });
    }
  }

  return (
    <Form {...form}>
      <div className="sm:w-420 h-full flex-center flex-col">
        <h1 className="h3-bold pt-3">PICTORA</h1>
        <h2 className="h3-bold md:h2-bold pt-1 sm:pt-2">Log in</h2>
        <p className="text-light-3 small-medium md:base-regular mt-1">Welcome Back</p>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-5 w-full mt-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" className="shad-input" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="shad-button_primary">
            { isUserLoading ? (
              <div className="flex-center gap-2">
                <Loader /> Loading...
              </div>
            ) : (
              "Log in"
            )}
          </Button>

          <p className="text-small-regular text-light-2 text-center mt-2">
            Don't Have an Account?
            <Link to="/sign-up" className="text-primary-500 text-small-semibold ml-1">
              Sign Up
            </Link>
          </p>
        </form>
      </div>
    </Form>
  );
};

export default SigninForm;
