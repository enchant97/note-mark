import { Component, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { A, useNavigate } from '@solidjs/router';
import { useApi } from '~/contexts/ApiProvider';
import { ToastType, apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import { ApiError, HttpErrors } from '~/core/api';
import Header from '~/components/header';
import Footer from '~/components/footer';

const Signup: Component = () => {
  const { api } = useApi()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [formDetails, setFormDetails] = createStore({
    username: "",
    password: "",
    passwordConfirm: "",
    name: "",
  })
  const [loading, setLoading] = createSignal(false)

  const onSubmit = async (ev: Event) => {
    ev.preventDefault()
    setLoading(true)
    let result = await api().createUser({
      username: formDetails.username,
      password: formDetails.password,
      name: formDetails.name || undefined,
    })
    setLoading(false)
    if (result instanceof ApiError) {
      if (result.status === HttpErrors.Forbidden) {
        pushToast({ message: "server is not accepting new accounts", type: ToastType.ERROR })
      } else {
        pushToast(apiErrorIntoToast(result, "creating account"))
      }
    } else {
      pushToast({ message: "created new account", type: ToastType.SUCCESS })
      navigate("/login")
    }
  }

  const passwordsMatch = () => formDetails.password === formDetails.passwordConfirm

  return (
    <div class="min-h-screen">
      <Header disableDrawerToggle={true} />
      <div class="bg-base-200 p-6 mx-6">
        <div class="card w-full max-w-md mx-auto bg-base-100">
          <div class="card-body text-center">
            <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
            <h1 class="text-5xl font-bold">Note Mark</h1>
            <p class="py-6">Create your account here.</p>
            <form onSubmit={onSubmit}>
              <label class="form-control">
                <span class="label label-text">Username</span>
                <input
                  class="input input-bordered"
                  value={formDetails.username}
                  oninput={(ev) => { setFormDetails({ username: ev.currentTarget.value }) }}
                  type="text"
                  placeholder="e.g. leo"
                  autocomplete="username"
                  pattern="[A-Za-z0-9]+"
                  minlength={3}
                  maxlength={30}
                  required
                />
              </label>
              <label class="form-control">
                <span class="label label-text">Full Name</span>
                <input
                  class="input input-bordered"
                  value={formDetails.name}
                  oninput={(ev) => { setFormDetails({ name: ev.currentTarget.value }) }}
                  type="text"
                  placeholder="e.g. Leo S"
                  maxlength={128}
                />
              </label>
              <label class="form-control">
                <span class="label label-text">Password</span>
                <input
                  class="input input-bordered"
                  value={formDetails.password}
                  oninput={(ev) => { setFormDetails({ password: ev.currentTarget.value }) }}
                  type="password"
                  placeholder="e.g. P@ssword123"
                  autocomplete="new-password"
                  required
                />
              </label>
              <label class="form-control">
                <span class="label label-text">Password Confirm</span>
                <input
                  class="input input-bordered"
                  classList={{ "input-error": !passwordsMatch() }}
                  value={formDetails.passwordConfirm}
                  oninput={(ev) => { setFormDetails({ passwordConfirm: ev.currentTarget.value }) }}
                  type="password"
                  placeholder="e.g. P@ssword123"
                  autocomplete="new-password"
                  required
                />
              </label>
              <div class="join join-vertical w-full mt-5">
                <button class="btn join-item btn-primary" disabled={!passwordsMatch() || loading()} type="submit">
                  {loading() && <span class="loading loading-spinner"></span>}
                  Create User
                </button>
                <A class="btn join-item" href="/login">Have An Account?</A>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Signup;
