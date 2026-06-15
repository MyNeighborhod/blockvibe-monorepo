# Local Development Setup with Docker

This project utilizes a PostgreSQL database. To simplify local development, a Docker Compose setup is configured in the **root directory** of this monorepo.

---

## 1. Prerequisites

Ensure you have the following installed and running:

- **Docker Desktop** (or the Docker daemon)
- **Node.js** (v18+ recommended)
- **pnpm** package manager

---

## 2. Starting the PostgreSQL Database Container

The Docker PostgreSQL service is defined in the monorepo root directory (`../../docker-compose.yml`). You can start it in one of two ways:

### Option A: From the Current Directory (`payload-web`)

Run the following command directly from this project folder:

```bash
docker compose -f ../../docker-compose.yml up -d postgres
```

### Option B: From the Monorepo Root Directory (`blockvibe-monorepo/`)

Navigate up two levels and spin up the database container:

```bash
cd ../..
docker compose up -d postgres
```

> [!NOTE]
> When the container is started for the first time, Docker automatically executes the `../../init.sql` script which initializes the `"04-payload-multitenant"` database.

---

## 3. Verifying the Container Status

To verify that the PostgreSQL container is running successfully, execute:

```bash
docker ps
```

You should see a container named `experiments-postgres-1` (or similar) running on port `5432`.

---

## 4. Configuration (`.env`)

The project is pre-configured to connect to the local Docker database via the `DATABASE_URL` environment variable. Ensure your `.env` contains the following connection string:

```env
DATABASE_URL=postgres://postgres:local@127.0.0.1:5432/04-payload-multitenant
```

---

## 5. Running the Application

Once the database is running:

1. **Install dependencies:**

   ```bash
   pnpm install
   ```

2. **Start the development server:**

   ```bash
   pnpm dev
   ```

3. **Access the application:**
   - **Website:** [http://localhost:3000](http://localhost:3000)
   - **Admin Panel:** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 6. Seed/Reset Data

If you need to seed or reset the database with tenant-specific layout configurations (pages, posts, header, footer, etc.), you can run the following script commands:

- **Seed North of Grand (NOG):**
  ```bash
  pnpm tsx src/scripts/seed-nog.ts
  ```
- **Seed Beaverdale:**
  ```bash
  pnpm tsx src/scripts/seed-beaverdale.ts
  ```
- **Global Database Seed (Default Tenant, posts, pages):**
  ```bash
  pnpm tsx src/scripts/test-seed.ts
  ```

---

## 7. Stopping the Database Container

To stop the PostgreSQL container, run:

```bash
docker compose -f ../../docker-compose.yml down
```

---

## 8. File Storage Architecture

By default, local file uploads are stored on the server's disk and dynamically partitioned by tenant into subdirectories under the `public/media/` folder.

### Local Partitioning (Development)

The `media` collection ([src/collections/Media.ts](file:///Users/eugen/dev/blockvibe/experiments/04-payload-multitenant/src/collections/Media.ts)) uses hooks to organize uploads:

- **`afterChange`**: Moves original uploads and their resized copies into `public/media/<tenant-slug>/` (or `public/media/global/` if not tenant-owned).
- **`afterRead`**: Intercepts requests and overrides the returned `url` property on the document and its sub-sizes to use the new subdirectory path (e.g. `/media/nog/logo.png`), allowing Next.js to serve them statically.
- **`beforeDelete`**: Automatically cleans up and unlinks all files from their respective subfolders when a media record is deleted.

### Production Storage (S3 / R2)

In production, file uploads should be directed to a cloud storage bucket.

1. Supply environment variables for S3:
   ```env
   S3_BUCKET=your-bucket-name
   S3_ACCESS_KEY_ID=your-key
   S3_SECRET_ACCESS_KEY=your-secret
   S3_REGION=us-east-1
   ```
2. When S3 environment variables are detected:
   - The `@payloadcms/storage-s3` plugin in `payload.config.ts` automatically activates.
   - The local filesystem hooks are disabled to let S3 natively handle upload prefixing and URL generation without disk operations.

### Future Migration to S3 (Local to Production)

If you have local files that you want to migrate to S3 during production deployment:

1. **Sync Local Files to S3 Bucket:**
   Use the AWS CLI to sync your local folders (including tenant subfolders) to the root of your target S3 bucket:

   ```bash
   aws s3 sync public/media/ s3://your-bucket-name/
   ```

   _Note: Ensure the local subfolder names (`nog/`, `beaverdale/`, `global/`) are preserved at the root of the bucket, as the S3 plugin uses the tenant slug as the prefix key._

2. **Configure CORS on S3:**
   Set up proper CORS policies on your S3 bucket to allow GET/PUT requests from your production domains (e.g., Next.js frontend and Payload Admin panel).

3. **Deploy & Enable S3 Config:**
   Deploy the S3 environment variables. Once the S3 plugin is active, Payload's S3 adapter will automatically generate cloud URLs (e.g. `https://your-bucket.s3.amazonaws.com/nog/image.jpg`) on the fly when querying media records, matching the file layout you synchronized.
