import { Component, createSignal } from 'solid-js';
import { createStore } from "solid-js/store";
import { A, useNavigate } from '@solidjs/router';
import { ToastType, apiErrorIntoToast, useToast } from '~/contexts/ToastProvider';
import Api, { HttpErrors } from '~/core/api';
import Header from '~/components/header';
import Icon from '~/components/icon';

const Signup: Component = () => {
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
    try {
      await Api.createUser({
        username: formDetails.username,
        password: formDetails.password,
        name: formDetails.name || undefined,
      })
      pushToast({ message: "created new account", type: ToastType.SUCCESS })
      navigate("/login")
    } catch (err) {
      if (err.status === HttpErrors.Forbidden) {
        pushToast({ message: "server is not accepting new accounts", type: ToastType.ERROR })
      } else {
        pushToast(apiErrorIntoToast(err, "creating account"))
      }
    } finally {
      setLoading(false)
    }
  }

  const passwordsMatch = () => formDetails.password === formDetails.passwordConfirm

  return (
    <div class="min-h-screen">
      <Header disableDrawerToggle={true} />
      <div class="p-6 mx-6">
        <div class="flex w-full max-w-md mx-auto">
          <div class="card-body text-center">
            <img class="mb-2 mx-auto w-36" src="/icon.svg" alt="Note Mark Icon" />
            <h1 class="text-5xl font-bold">Note Mark</h1>
            <form onSubmit={onSubmit}>
              <fieldset class="fieldset">
                <legend class="fieldset-legend">Create Account</legend>
                <label class="input validator">
                  <Icon name="user" />
                  <input
                    value={formDetails.username}
                    oninput={(ev) => { setFormDetails({ username: ev.currentTarget.value }) }}
                    type="text"
                    placeholder="Username"
                    autocomplete="username"
                    pattern="[A-Za-z0-9]+"
                    minlength={3}
                    maxlength={30}
                    required
                  />
                </label>
                <p class="validator-hint hidden">
                  Must be 3 to 30 characters
                  <br />containing only letters and numbers
                </p>
                <label class="input validator">
                  <Icon name="edit-3" />
                  <input
                    value={formDetails.name}
                    oninput={(ev) => { setFormDetails({ name: ev.currentTarget.value }) }}
                    type="text"
                    placeholder="Full Name"
                    maxlength={128}
                  />
                </label>
                <p class="validator-hint hidden">
                  Must be 0 to 128 characters
                </p>
                <label class="input validator">
                  <Icon name="lock" />
                  <input
                    value={formDetails.password}
                    oninput={(ev) => { setFormDetails({ password: ev.currentTarget.value }) }}
                    type="password"
                    placeholder="Password"
                    autocomplete="new-password"
                    required
                  />
                </label>
                <label class="input validator">
                  <Icon name="lock" />
                  <input
                    classList={{ "input-error": !passwordsMatch() }}
                    value={formDetails.passwordConfirm}
                    oninput={(ev) => { setFormDetails({ passwordConfirm: ev.currentTarget.value }) }}
                    type="password"
                    placeholder="Password Confirm"
                    autocomplete="new-password"
                    required
                  />
                </label>
              </fieldset>
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
    </div>
  );
};

export default Signup;
