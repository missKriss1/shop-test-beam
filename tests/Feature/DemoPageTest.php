<?php

it('renders the demo page', function () {
    $this->get('/demo')->assertOk();
});

it('renders the welcome page', function () {
    $this->get('/')->assertOk();
});
