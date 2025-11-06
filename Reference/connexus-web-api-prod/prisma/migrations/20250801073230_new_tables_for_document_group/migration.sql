-- CreateTable
CREATE TABLE "document_groups" (
    "id" SERIAL NOT NULL,
    "group_name" TEXT NOT NULL,
    "description" TEXT,
    "first_page_content" TEXT NOT NULL,
    "first_page_markdown" TEXT,
    "embedding_vector_id" VARCHAR(100),
    "embedding_model" VARCHAR(100) NOT NULL DEFAULT 'gemini-embedding-001',
    "embedding_dimension" INTEGER NOT NULL DEFAULT 1536,
    "document_type" VARCHAR(100),
    "document_category" VARCHAR(100),
    "document_count" INTEGER NOT NULL DEFAULT 1,
    "last_matched_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_prompt_templates" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "prompt_name" TEXT NOT NULL,
    "prompt_template" TEXT NOT NULL,
    "prompt_variables" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matched_documents" (
    "id" SERIAL NOT NULL,
    "group_id" INTEGER NOT NULL,
    "file_path" VARCHAR(500) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "file_hash" VARCHAR(64),
    "similarity_score" DOUBLE PRECISION NOT NULL,
    "matched_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processing_time" DOUBLE PRECISION,
    "first_page_preview" TEXT,

    CONSTRAINT "matched_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "document_groups_group_name_key" ON "document_groups"("group_name");

-- AddForeignKey
ALTER TABLE "group_prompt_templates" ADD CONSTRAINT "group_prompt_templates_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matched_documents" ADD CONSTRAINT "matched_documents_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "document_groups"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
