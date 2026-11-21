All right, I want to have this skill written for...

So, is basically the skeleton, the structure, the scaffold for building Python Flask apps.

And so, this is... I'll first want to talk about the layouts, you know, and I think that's a really important thing, the structure of, you know, and how I want things to be built.

We will have the structure, so we have the app itself, app.py or whatever it's going to be called. We will have the following folders inside the base folder:
- assets
- views
- routes
- controllers
- models
- databases
- uploads
- downloads
- unit tests
- migration

For the Flask app, a couple of things will be bundled in here:
- In assets, we will be using Vue.js, which will be our reactivity JavaScript library.
- We will be using SQLAlchemy, not Flask-SQLAlchemy, but SQLAlchemy.
- Of course, it will be Jinja2 templating.
- We will have Socket.IO, but only if needed. We can have it baked in there but commented out.
- For the routes, we'll be using blueprints to create routes in the routes folder, so we'll have to register blueprints in the base app.

In the assets folder, we're going to have a CSS folder, a scripts folder for JavaScript (or we could call it ES6), images, and fonts. The fonts folder will hold things like icon fonts and that type of thing.

Moving away from there to the views folder, we're going to hold the templates there using Jinja2 templating. We'll have a base template which other templates will extend. This doesn't stop us from having a login or landing page which might be radically different from the base template for most of the other pages, but that base will be the boilerplate that will be extended.

For the routes, we could actually map those to folders inside of the views folder so that all of the views or template files for a particular route will live in a correspondingly named folder inside. If we have a route called business, there should be a business folder inside of the views.

Apart from this, we want to also have a folder called elements inside of views, and that will hold elements that can be imported into the different templates. If we have elements that are reusable, like cards or a particular table, something that's reusable that's called into other files, they will live inside of the elements folder.

The routes folder will hold the Python files that are the routes themselves, which will instantiate Flask blueprints and will also have the URL path sets, so those can be done in there.

For the controllers folder, that will hold functions and classes that are useful across the app that we've built. They'll live in the controllers folder. I don't think there's a need for us to have a helpers folder or something else or a factory folder. I think controllers folder is fine. It'll hold all of those things.

Then to the models folder, this will hold anything related to database models. Databases will hold SQLite and/or .db files if we want to have anything that's persisted somewhere inside of there.

And then also, we will have uploads for if anyone wants to upload stuff, downloads for if you want to download stuff. Since we're going to also be creating a skeleton for this thing, we can have .gitignore inside of these folders, or some . files inside of there. Let's do ... inside of uploads, ... inside of downloads until they're in use. Same for any folder that's empty like CSS, ES6, and all of that for now, or scripts, whatever we'll call it.

Now, unit tests will hold the Python unit tests because for ... apps, we expect that they'll be unit tested rigorously. And then migration will be for Alembic. Alembic is another important part of this project. Alembic should be part of this project.

Alembic will handle all database migration types.

Other important things here are:
- There should be a config.yaml file. I like the idea of YAML files, so there will be a config.yaml that will hold things like database configuration, secrets, and whatever else, and that will be called into the app.py file.
- We could also keep a .env file in here so that if we're doing stuff with uv or with venv, we can always access the .env file for environment variables.

I want Ellipsis to be both a skill and a git repository. If there's a connection, we can pull the git repository in as a scaffold and then build from there. If not, the skill should know enough of the architecture to be able to scaffold everything from scratch. That's how the skill would work for Ellipsis. So if we do /ellipsis or say I want to build an Ellipsis app, it should know what to do to create the Ellipsis app.

In the README and documentation for Ellipsis, it should also include the tree structure for it. For the models, for any database tables we're creating, I would like for us to always have a couple of standard columns, except where it's absolutely not necessary, just so that it becomes something that's standard in terms of working. I expect us to have ID, UUID, created at, updated at, created by, updated by. It's fine if these columns are not needed, then we can leave them out for any tables that won't be able to fill out any of these columns. But as long as those columns can be filled out, I think they should exist for those tables. Ellipsis can always handle the migrations, so we could drop or keep them, but they should be a default if these fields can be filled out. So I go over them again: ID, UUID, created at, updated at, created by, updated by. I don't know if it makes sense to also have a deleted at and deleted by, but that's something else to think about.

Now, because we might do load balancing at some point and have our app distributed, we need to be able to manage sessions and all that. So, Ellipsis should also come with Redis caching for anything that requires that type of caching. Redis will handle those.