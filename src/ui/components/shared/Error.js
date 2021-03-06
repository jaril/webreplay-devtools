import React, { useState } from "react";
import classnames from "classnames";
import useAuth0 from "ui/utils/useAuth0";
import { connect } from "react-redux";
import { selectors } from "ui/reducers";

import "./Error.css";

function RefreshButton() {
  const [clicked, setClicked] = useState(false);
  const handleClick = () => {
    setClicked(true);
    location.reload();
  };

  return (
    <button className={classnames({ clicked })} onClick={handleClick}>
      <div className="img refresh" />
      <span className="content">Refresh</span>
    </button>
  );
}

function SignInButton() {
  const { loginWithRedirect } = useAuth0();

  return <button onClick={loginWithRedirect}>Sign in</button>;
}

function ActionButton({ action }) {
  if (action == "refresh") {
    return <RefreshButton />;
  } else if (action == "sign-in") {
    return <SignInButton />;
  }

  return null;
}

function ErrorContainer({ children, unexpected, expected }) {
  return (
    <div className={classnames("error-container", { expected, unexpected })}>
      <div className="error-mask" />
      {children}
    </div>
  );
}

function Error({ children, refresh, expected, unexpected, error }) {
  return (
    <ErrorContainer unexpected={unexpected} expected={expected}>
      <div className="error-content">
        <h1>Whoops</h1>
        {children}
        {error.message ? <p className="error-message">{error.message}</p> : null}
        <ActionButton action={refresh ? "refresh" : error?.action} />
      </div>
    </ErrorContainer>
  );
}

function ExpectedError({ error }) {
  // This is for the class of errors that:
  // 1) Happens before to the app's initial page load has successfully completed.
  // 2) Is deterministic (e.g. bad recording ID).
  // 3) Will not be fixed by a page refresh.

  if (error.type == "timeout") {
    return (
      <ErrorContainer expected>
        <div className="transparent-error-content">
          <div className="img refresh" onClick={() => location.reload()}></div>
          <div className="message">{error.message}</div>
        </div>
      </ErrorContainer>
    );
  }

  const isServerError = error.code;
  const content = isServerError ? "Looks like something went wrong with this page" : error.message;

  return (
    <Error error={error} expected>
      <p>{content}</p>
    </Error>
  );
}

function UnexpectedError({ error }) {
  // This is for the class of errors that:
  // 1) Happens after the app's initial page load has successfully completed.
  // 2) Is non-deterministic (e.g. an unexpected crash).
  // 3) Might be fixed by a page refresh.

  return (
    <Error error={error} refresh unexpected>
      <p>Looks like something went wrong with this page</p>
    </Error>
  );
}

function _AppErrors({ expectedError, unexpectedError }) {
  return (
    <>
      {expectedError ? <ExpectedError error={expectedError} /> : null}
      {unexpectedError ? <UnexpectedError error={unexpectedError} /> : null}
    </>
  );
}

export const AppErrors = connect(
  state => ({
    expectedError: selectors.getExpectedError(state),
    unexpectedError: selectors.getUnexpectedError(state),
  }),
  null
)(_AppErrors);

export function PopupBlockedError() {
  const error = { message: "OAuth consent popup blocked" };

  return (
    <Error refresh expected error={error}>
      <p>Please turn off your pop up blocker and refresh this page.</p>
    </Error>
  );
}
